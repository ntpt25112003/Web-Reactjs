import { PushNotifications, DeliveredNotifications } from '@capacitor/push-notifications';
import { BehaviorSubject } from 'rxjs';
import storageService, { StorageKey } from './storageService';
import appService from './appService';
import {apiService} from './apiService';
import deviceService from './deviceService';

interface NotificationItem {
  id: number;
  notificationDetailId: number;
  title: string;
  content: string;
  link: string;
  templateId: number;
  notificationSystemId: number;
  typeNotification: number;
  fromEmail: string | null;
  sendDate: string;
  sendDateString: string;
  isSeen: boolean;
}
interface NotificationResponse {
  result: {
    isSucceeded: boolean;
    data: NotificationItem[];
    message: string;
    code: string;
    value: any;
    obj: any;
  };
  targetUrl: string | null;
  success: boolean;
  error: any;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

class NotifyService {

    // Config
    private readonly h_debug: boolean = false;
  
    // Properties
    private m_register: boolean = false;
    private m_token: string = ''; // Firebase Token
    private m_notificationType: number = 1;
  
    public notificationCountSubject = new BehaviorSubject<number>(0);
    notificationCount$ = this.notificationCountSubject.asObservable();
  
  
    // Method
    constructor(
      private storage: typeof storageService,
      private app: typeof appService,
      private api: typeof apiService,
      private device: typeof deviceService,
    ) { }

    public async initializeNotificationCount(userId: number) {
        await this.updateNotificationCount(userId);
    }
    
    // Register
    public async loadCache() {
    
        // Load storage
        this.m_token = await this.storage.get(StorageKey.TOKEN_FB) || '';
        this.m_register = (this.m_token.length > 0);
    
        if (!this.app.isAndroid() && !this.app.isIOS()) {
          // CASE: platform not support
    
          // Log
          this.app.log('[notify.service] loadCache', {
            warning: "Thiết bị không hỗ trợ thông báo đẩy"
          }, this.h_debug);
    
          return;
        }
    
        // Log
        this.app.log('[notify.service] loadCache', {
          m_token: this.m_token,
        }, this.h_debug);
      }

    public async init(launcher: any): Promise<boolean> {
        let log: any = {};
        try {
    
          // Kiểm tra phân quyền
          if ((await this.device.pushNotification_available()) == false)
            throw { warning: true, msg: "Thiết bị không hỗ trợ thông báo đẩy" };
    
          // Xin Cấp quyền Push Notification
          let permission_push = await this.device.pushNotification_permission(false);
          log.permission_push = permission_push;
    
          // Xin Cấp quyền Local Notification
          let permission_local = await this.device.localNotification_permission(false);
          log.permission_local = permission_local;
    
          // Kiểm tra cài đặt
          let setting: boolean|null = (await this.storage.get(StorageKey.SETTING_NOTIFY, 'boolean'));
          log.setting = setting;
    
          // Setting ko cho thông báo thì bỏ qua init
          if (setting == false)
            return false;
          else if (setting == null) // Sau khi đồng ý / từ chối thì lưu setting nếu chưa có
            await this.storage.set(StorageKey.SETTING_NOTIFY, permission_push);
    
          if (!permission_push)
            throw { warning: true, msg: "Người dùng từ chối nhận thông báo" };
    
          await this.register(launcher);
    
          return true;
        }
        catch (e: any) {
          if (e.warning)
            log.warning = e;
          else
            log.error = e;
          return false;
        }
        finally {
          this.app.log('[notify.service] init', log, this.h_debug);
        }
    }

    public async register(launcher: any): Promise<boolean> {
        let log: any = {};
        try {
    
          log.m_register = this.m_register
          if (this.m_register)
            return true;
    
          // Kiểm tra thiết bị hỗ trợ
          if ((await this.device.pushNotification_available()) == false)
            throw { warning: true, msg: "Thiết bị không hỗ trợ thông báo đẩy" };
    
          let permission = await this.device.pushNotification_permission(false);
          log.permission = permission;
          if (!permission)
            throw { warning: true, msg: "Người dùng từ chối nhận thông báo" };
    
          let token: any = await new Promise(async(resolve, reject) => {
            await PushNotifications.removeAllListeners();
            await PushNotifications.addListener('registration', token => resolve(token));
            await PushNotifications.addListener('registrationError', err => reject(err));
            await PushNotifications.addListener('pushNotificationReceived', notification => launcher.onReceive(notification));
            await PushNotifications.addListener('pushNotificationActionPerformed', notification => launcher.onAction(notification));
            await PushNotifications.register();
          });
          log.token = token;
    
          // Set Token
          this.setToken(token.value);
    
          // Đăng ký nghe sự kiện onTap_LocalNotification
          await this.device.localNotification_register(event => launcher.onLocalAction(event));
    
          // Mark
          this.m_register = true;
    
          return true;
        }
        catch (e: any) {
          if (e.warning)
            log.warning = e;
          else
            log.error = e;
          return false;
        }
        finally {
          this.app.log('[notify.service] register', log, this.h_debug);
        }
    }

    public async unregister(): Promise<boolean> {
        let log: any = {};
        try {
    
          log.m_register = this.m_register;
          if (!this.m_register)
            return false;
    
          // Kiểm tra thiết bị hỗ trợ
          if ((await this.device.pushNotification_available()) == false)
            throw { warning: true, msg: "Thiết bị không hỗ trợ thông báo đẩy" };
    
          // Hủy callback
          await PushNotifications.removeAllListeners();
    
          // Hủy đăng ký
          await PushNotifications.unregister();
    
          // Call API Xóa token của thiết bị
          log.m_token = this.m_token;
          if (this.m_token.length > 0) {
            try {
              await this.api.RemoveFirebaseToken(this.m_token);
            }
            catch (e: any) {
              this.app.log('[notify.service] unregister - RemoveFirebaseToken', { warning: e }, this.h_debug);
            }
          }
    
          // Hủy đăng ký nghe Local Notifucation
          await this.device.localNotification_unregister();
    
          // Mark
          this.m_register = false;
    
          return true;
        }
        catch (e: any) {
          if (e.warning)
            log.warning = e;
          else
            log.error = e;
          throw e;
        }
        finally {
          this.app.log('[notify.service] unregister', log, this.h_debug);
        }
    }
    
    // Get / Set
    public setToken(token: string) {
    
        if (this.m_token == token) {
          // CASE trùng token
    
          // Log
          this.app.log('[notify.service] setToken', {
            warning: "Trùng firebase token"
          }, this.h_debug);
    
          return;
        }
    
        // Set Token
        this.m_token = token;
        this.storage.set(StorageKey.TOKEN_FB, token);
    
        // Register BE
        if (this.app.isIOS() || this.app.isAndroid()) {
          let device = this.app.getDevice();
    
          // Call API Update Token
          this.api.updateFirebaseToken(token
            , device.Info.model
            , device.Info.manufacturer
            , device.Info.platform
            , device.Id.identifier
          );
        }
    }

    public getToken(): string {
        return this.m_token;
    }

    public async getDelivered(): Promise<DeliveredNotifications> {
        const notificationList = await PushNotifications.getDeliveredNotifications();
        return notificationList
      }
    
      public async markNotificationAsSeen(userId: number, notificationId: number) {
        try {
          //Call api
          // await this.api.markNotificationAsSeen(notificationId);
          await this.updateNotificationCount(userId);
        } catch (error) {
          console.error('Error marking notification as seen:', error);
        }
      }
      public async updateNotificationCount(userId: number) {
        try {
          const notifications = await this.getNotifications(userId);
          const unseenCount = notifications.filter(n => !n.isSeen).length;
          this.notificationCountSubject.next(unseenCount);
        } catch (error) {
          console.error('Error updating notification count:', error);
        }
    }
    
    public async getNotifications(userId: number): Promise<NotificationItem[]> {
        try {
          const notificationData = await this.api.getNotifications(userId, this.m_notificationType) as NotificationResponse;
          if (notificationData.success && notificationData.result.isSucceeded) {
            const notifications = notificationData.result.data;
            this.notificationCountSubject.next(notifications.filter(n => !n.isSeen).length);
            return notifications;
          } else {
            console.error('API request was not successful:', notificationData);
            return [];
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
          return [];
        }
      }
      public getNotificationCount(): number {
        return this.notificationCountSubject.value;
    }
}

const notifyService = new NotifyService(storageService, appService, apiService, deviceService);
export default notifyService;
