import { Camera, CameraResultType, CameraSource, GalleryImageOptions, GalleryPhotos, ImageOptions } from '@capacitor/camera';
// import { Clipboard, WriteOptions } from '@capacitor/clipboard';
import { Directory, Filesystem } from '@capacitor/filesystem';
// import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { CancelOptions, LocalNotifications, ScheduleOptions, ScheduleResult } from '@capacitor/local-notifications';
import { CurrentRecordingStatus, GenericResponse, RecordingData, RecordingOptions, VoiceRecorder } from 'capacitor-voice-recorder';
// import 'barcode-detector/polyfill';
import fileService  from './fileService';
import utilService from './utilService';
import configService from './configService';
import appService from './appService';

class DeviceService {
    private h_debug = true;

    // Const

    // permission
    private m_permissionPushNotification: boolean = false;
    private m_permissionLocalNotification: boolean = false;
    private m_permissionCamera_camera: boolean = false;
    private m_permissionCamera_gallery: boolean = false;
    private m_permissionFile: boolean = false;
    // private m_permissionLocation_location: boolean = false;
    // private m_permissionLocation_coarseLocation: boolean = false;
    private m_permissionAudioRecord: boolean = false;
  
    constructor(
      private config: typeof configService,
      private util: typeof utilService,
      private app: typeof appService,
      private file: typeof fileService
    ) {}

    public async pushNotification_available(): Promise<boolean> {
        return false;
      }
    
    public async pushNotification_permission(force: boolean): Promise<boolean> {
        const log: any = { force };
      
        try {
          log.m_permissionPushNotification = this.m_permissionPushNotification;
          if (this.m_permissionPushNotification) return true;
      
          // Nếu trình duyệt không hỗ trợ
          if (!('Notification' in window)) {
            throw { error: true, msg: "Trình duyệt không hỗ trợ Web Push Notification!" };
          }
      
          const permission = Notification.permission;
          log.permission_1 = permission;
      
          let finalPermission = permission;
      
          // Xin quyền nếu cần
          if (force || permission === 'default') {
            finalPermission = await Notification.requestPermission();
            log.permission_2 = finalPermission;
          }
      
          const granted = finalPermission === 'granted';
          log.granted = granted;
      
          if (granted) this.m_permissionPushNotification = true;
          return granted;
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
          this.app.log('[device.services] pushNotification_permission', log, this.h_debug);
        }
    }
      
    
      // Local Notification Web (Notification API)
      public async localNotification_permission(force: boolean): Promise<boolean> {
        const log: any = { force };
    
        if (!('Notification' in window)) {
          log.supported = false;
          appService.log('[device.services] localNotification_permission', log, this.h_debug);
          return false;
        }
    
        const permission = Notification.permission;
        log.currentPermission = permission;
    
        if (permission === 'granted') {
          return true;
        }
    
        if (force || permission === 'default') {
          const result = await Notification.requestPermission();
          log.requested = result;
          return result === 'granted';
        }
    
        appService.log('[device.services] localNotification_permission', log, this.h_debug);
        return false;
      }
    
    public async localNotification_register(funcOnTap: (event: any) => void): Promise<void> {
        const log: any = {};
        try {
          await LocalNotifications.removeAllListeners();
      
          // Lắng nghe khi người dùng nhấn vào thông báo
          await LocalNotifications.addListener('localNotificationActionPerformed', funcOnTap);
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
          this.app.log('[device.service] localNotification_register', log, this.h_debug);
        }
    }
    
    public async localNotification_unregister(): Promise<void> {
        const log: any = {};
        try {
          await LocalNotifications.removeAllListeners();
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
          this.app.log('[device.service] localNotification_unregister', log, this.h_debug);
        }
    }

    public async localNotification_create(
        title: string,
        body: string,
        data: any,
        opts: any = {}
      ): Promise<number> {
        const log: any = {};
        try {
          const id = this.util.getRandomNum(-2147483648, 2147483647); // Java int range
      
          const option: ScheduleOptions = {
            notifications: [
              {
                id,
                title,
                body,
                extra: data,
                schedule: {
                  at: new Date(Date.now() + (opts.delayTime || 100)), // delay tối thiểu
                  repeats: false,
                },
                autoCancel: opts.autoCancel ?? true, // nullish coalescing để đảm bảo đúng kiểu boolean
                ongoing: opts.ongoing ?? false,
              },
            ],
          };
          log.option = option;
      
          const resSchedule: ScheduleResult = await LocalNotifications.schedule(option);
          log.resSchedule = resSchedule;
      
          return id;
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
          this.app.log('[device.service] localNotification_create', log, this.h_debug);
        }
    }
    
    public async localNotification_clean(ids: number[]) {
        let log: any = { ids };
        try {
    
          // Call Native - Tắt thông báo
          let options: CancelOptions = { notifications: [] };
          for (let id of ids)
            options.notifications.push({ id });
          log.options = options;
          await LocalNotifications.cancel(options);
    
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] localNotification_clean', log, this.h_debug);
        }
    }

    public async localNotification_getList(): Promise<any[]> {
        let log: any = {};
        try {
          let list = await LocalNotifications.getDeliveredNotifications();
          log.list = list.notifications;
          return list.notifications;
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] localNotification_cancel', log, this.h_debug);
        }
    }

    // Camera
    public async permissionCamera(type: 'camera'|'gallery'): Promise<boolean> {
        if (type == 'camera') {
          if (this.m_permissionCamera_camera)
            return true;
    
          if (this.app.isWeb())
            return true;
    
          let permission = await Camera.checkPermissions();
          if (permission.camera != 'granted')
            permission = await Camera.requestPermissions({ permissions: ['camera'] });
    
          let granted = (permission.camera == 'granted');
          if (granted)
            this.m_permissionCamera_camera = true;
          return granted;
        }
        else if (type == 'gallery') {
          if (this.m_permissionCamera_gallery)
            return true;
    
          let permission = await Camera.checkPermissions();
          if (permission.photos != 'granted')
            permission = await Camera.requestPermissions({ permissions: ['photos'] });
    
          let granted = (permission.photos == 'granted');
          if (granted)
            this.m_permissionCamera_gallery = true;
    
          return granted;
        }
        return false;
    }

    public async camera(options?: any): Promise<File|null> { // Mở camera
        /**
         * direction: REAR | FRONT
         */
        let log: any = { options: options };
        try {
    
          // Permission
          let permission = await this.permissionCamera('camera');
          if (permission == false)
            return null; // CASE từ chối cấp quyền
    
          // Prepare
          let opts: ImageOptions = {
            source: CameraSource.Camera,
            quality: 90,
            allowEditing: false,
            saveToGallery: false,
            resultType: CameraResultType.Base64,
          };
          if (options != null)
            opts = Object.assign(opts, options);
          log.opts = opts;
    
          // Open Camera
          let image: any = await Camera.getPhoto(opts).catch(() => null);
          log.image = image;
    
          if (image == null)
            return null;
    
          // Generage name photo take
          let format = image.format || 'jpeg';
          image.name = 'Photo_' + this.util.sysdate(this.util.H_FM_DATETIME_NAME) + '.' + format;
    
          let mimeType = this.file.getMimeType(image.format);
          let blob = this.file.base64ToBlob(image.base64String, mimeType);
          return new File([blob], image.name, { type: mimeType });
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] camera', log, this.h_debug);
        }
    }

    public async gallery(params?: any): Promise<File[]> { // Mở thư viện ảnh
        /* Params:
         *  {
         *    limit: 5 (0: ko giới hạn, num: số lượng ảnh giới hạn)
         *  }
         */
        let log: any = { params: params };
        try {
    
          // Permission
          let permission = await this.permissionCamera('gallery');
          if (permission == false)
            return []; // CASE từ chối cấp quyền
    
          // Prepare
          let opts: GalleryImageOptions = { };
          if (params != null)
            opts = Object.assign(params);
          log.opts = opts;
    
          // Open Photo Picker
          let resPick: GalleryPhotos | null = await Camera.pickImages(opts).catch(() => null);
    
          let images = resPick?.photos || [];
          if (images.length == 0) // Ko chọn ảnh thì skip
            return [];
    
          let listFile: File[] = [];
          for (let image of images) {
            let filepath = image.path || image.webPath || ''; // Lấy filepath
            if (filepath.length == 0) // Nếu ko tìm thấy thì skip
              continue;
            let mimeType = this.file.getMimeType(image.format); // Lấy mimetype
            let filename = this.file.getFilename(filepath); // Lấy file name từ path
            if (filename.indexOf('.') == -1)
              filename += '.' + image.format; // Bổ sung EXT nếu thiếu
            let base64Data = await this.file.readFile(filepath, true, false); // Đọc Data
            let blob = this.file.base64ToBlob(base64Data, mimeType); // Convert Blob
            listFile.push(new File([blob], filename, { type: mimeType })); // Add List File
          }
    
          // Return
          return listFile;
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] gallery', log, this.h_debug);
        }
    }

    // File
    public async permissionFile(): Promise<boolean> {

        if (this.m_permissionFile)
        return true;

        // Kiểm tra quyền
        let status = await Filesystem.checkPermissions(); // Kiểm tra

        // Xin cấp quyền nếu chưa có
        if (status.publicStorage != 'granted')
        status = await Filesystem.requestPermissions();

        let granted = (status.publicStorage == 'granted');
        if (granted)
        this.m_permissionFile = true;

        return granted;
    }

    public async clipboardWrite(value: string, type: string = 'string') {
        try {
          if (type === 'string' || type === 'url') {
            await navigator.clipboard.writeText(value);
          } else if (type === 'image') {
            const blob = await (await fetch(value)).blob();
            const clipboardItem = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([clipboardItem]);
          }
        } catch (e) {
          console.error('[clipboardWrite] error:', e);
          throw e;
        }
    }

    public async clipboardRead(): Promise<{ value: string, type: string }> {
        try {
          const text = await navigator.clipboard.readText();
          return { value: text, type: 'string' };
        } catch (e) {
          console.error('[clipboardRead] error:', e);
          throw e;
        }
    }

    // Audio Record
    public async permissionAudioRecord(): Promise<boolean>{
        let log: any = {};
        try {
    
          if (this.m_permissionAudioRecord)
            return true;
    
          // if (this.app.isWeb())
          //   return true;
    
          let permission: GenericResponse = await VoiceRecorder.hasAudioRecordingPermission()
            .catch(() => { throw { error: true, msg: "Lỗi tìm trạng thái quyền ghi âm" }; });
          if (!permission.value)
            permission = await VoiceRecorder.requestAudioRecordingPermission();
          log.permission = permission;
    
          let granted = permission.value;
          if (granted)
            this.m_permissionAudioRecord = true;
          return granted;
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] permissionAudioRecord', log, this.h_debug);
        }
    }

    public async runAudioRecord(toogle: boolean, folder?: string): Promise<any> {
        // return {
        //   recordDataBase64, // The recorded audio data in Base64 format.
        //   msDuration // The, duration of the recording in milliseconds.
        //   mimeType, // The MIME type of the recorded audio.
        //   uri, // The URI to the audio file
        // }
        let log: any = {};
        try {
    
          if (await this.permissionAudioRecord() == false)
            throw { error: true, msg: "Bạn đã từ chối cấp quyền ghi âm!" };
    
          if (toogle) { // Start
    
            if (await this.statusAudioRecord() != 'NONE')
              throw { warning: true, msg: "Ghi âm đã kích hoạt từ trước!" };
    
            // Nếu có thư mục thì lưu xuống, ko thì lấy base64
            let options: RecordingOptions | undefined = undefined;
            if (folder != undefined) {
              options = {
                directory: Directory.Documents,
                subDirectory: this.config.STORAGE_FOLDER + '/' + folder
              };
            }
    
            let result: GenericResponse = await VoiceRecorder.startRecording(options)
              .catch ((e: any) => {
                let msgErr: string = "";
                switch (e.Code) {
                  case 'MISSING_PERMISSION': msgErr = "Chưa cấp quyền ghi âm!"; break;
                  case 'DEVICE_CANNOT_VOICE_RECORD': msgErr = "Thiết bị không dùng được ghi âm!"; break;
                  case 'ALREADY_RECORDING': msgErr = "Ghi âm đã kích hoạt từ trước!"; break;
                  case 'MICROPHONE_BEING_USED': msgErr = "Micro đang bị chiếm dụng!"; break;
                  case 'FAILED_TO_RECORD': msgErr = "Lỗi ghi âm!"; break;
                  default: msgErr = "Lỗi bật ghi âm!";
                }
                throw { error: true, msg: msgErr, detail: e };
              });
            log.result = result;
    
            if (result.value == false)
              throw { warning: true, msg: "Không thể kích hoạt ghi âm!" };
    
            return null;
          }
          else { // Stop
    
            if (await this.statusAudioRecord() == 'NONE')
              throw { warning: true, msg: "Ghi âm chưa được kích hoạt!" };
    
            let result: RecordingData = await VoiceRecorder.stopRecording()
              .catch((e: any) => {
                let msgErr: string = "";
                switch (e.Code) {
                  case 'RECORDING_HAS_NOT_STARTED': msgErr = "Ghi âm chưa được kích hoạt!"; break;
                  case 'EMPTY_RECORDING': msgErr = "Chưa có dữ liệu ghi âm!"; break;
                  case 'FAILED_TO_FETCH_RECORDING': msgErr = "Lỗi không xác định khi ghi âm!"; break;
                  default: msgErr = "Lỗi tắt ghi âm!";
                }
                throw { error: true, msg: msgErr };
              });
            log.result = result;
    
            return result.value;
          }
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] runAudioRecord', log, this.h_debug);
        }
    }

    public async pauseAudioRecord(toogle: boolean) {
        let log: any = {};
        try {
    
          if (!this.m_permissionAudioRecord)
            throw { error: true, msg: "Bạn đã từ chối cấp quyền ghi âm!" };
    
          let status = await this.statusAudioRecord();
          log.status = status;
          if (status == 'NONE')
            throw { warning: true, msg: "Ghi âm chưa được kích hoạt!" };
    
          if (toogle) { // Tạm ngừng
    
            if (status == 'PAUSED')
              throw { warning: true, msg: "Ghi âm đã tạm ngừng từ trước!" };
    
            let result: GenericResponse = await VoiceRecorder.pauseRecording()
              .catch((e: any) => {
                let msgErr: string = "";
                switch (e.Code) {
                  case 'RECORDING_HAS_NOT_STARTED': msgErr = "Ghi âm chưa được kích hoạt!"; break;
                  case 'NOT_SUPPORTED_OS_VERSION': msgErr = "Thiết bị không hỗ trợ chức năng!"; break;
                  default: msgErr = "Lỗi tạm ngưng ghi âm!";
                }
                throw { error: true, msg: msgErr };
              });
            log.result = result;
    
            if (result.value == false)
              throw { warning: true, msg: "Không thể tạm ngừng ghi âm!" };
    
          }
          else { // Tiếp tục
    
            if (status == 'RECORDING')
              throw { warning: true, msg: "Ghi âm đang chạy!" };
    
            let result: GenericResponse = await VoiceRecorder.resumeRecording()
              .catch((e: any) => {
                let msgErr: string = "";
                switch (e.Code) {
                  case 'RECORDING_HAS_NOT_STARTED': msgErr = "Ghi âm chưa được kích hoạt!"; break;
                  case 'NOT_SUPPORTED_OS_VERSION': msgErr = "Thiết bị không hỗ trợ chức năng!"; break;
                  default: msgErr = "Lỗi tiếp tục ghi âm!";
                }
                throw { error: true, msg: msgErr };
              });
            log.result = result;
          }
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] pauseAudioRecord', log, this.h_debug);
        }
    }

    public async statusAudioRecord(): Promise<string> {
        // "RECORDING" | "PAUSED" | "NONE"
        let log: any = {};
        try {
    
          if (!this.m_permissionAudioRecord)
            throw { error: true, msg: "Bạn đã từ chối cấp quyền ghi âm!" };
    
          let result: CurrentRecordingStatus = await VoiceRecorder.getCurrentStatus();
          log.result = result.status;
          return result.status;
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[device.service] pauseAudioRecord', log, this.h_debug);
        }
    }   
}

const deviceService = new DeviceService(configService, utilService,appService, fileService);
export default deviceService;
