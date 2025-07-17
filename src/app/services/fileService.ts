import { DeleteFileOptions, Directory, Filesystem, MkdirOptions, ReadFileOptions, ReadFileResult, RmdirOptions, StatOptions, WriteFileOptions } from '@capacitor/filesystem';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';
// import { FilePicker, PickFilesResult } from '@capawesome/capacitor-file-picker';
import configService from './configService';
import { apiService } from './apiService';
import ShowService  from './showService';
import { CapacitorException } from '@capacitor/core';
import appService from './appService';

class FileService {
    private h_debug = false;
    private h_directory = Directory.Documents;
    private m_mimeType: any = null;
  
    constructor(
        private config: typeof configService,
        private app: typeof appService,
        private api: typeof apiService,
        private show: typeof ShowService
    ) {}

    // Action
    public async checkPath(filepath: string): Promise<any> {
        let log: any = { filepath };
        try {
          const options: StatOptions = {
            path: `${this.config.STORAGE_FOLDER}/${filepath}`,
            directory: this.h_directory,
          };
          log.options = options;
          const res = await Filesystem.stat(options);
          log.res = res;
          return res;
        } catch (e: any) {
          log.exception = e;
          return null;
        } finally {
          appService.log('[file.service] checkPath', log, this.h_debug);
        }
    }
    
    public async createFolder(folderpath: string) {
        let log: any = { folderpath };
        try {
          const options: MkdirOptions = {
            path: `${this.config.STORAGE_FOLDER}/${folderpath}`,
            directory: this.h_directory,
            recursive: true,
          };
          log.options = options;
          await Filesystem.mkdir(options);
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
            appService.log('[file.service] createFolder', log, this.h_debug);
        }
    }
    
    public async saveFile(filepath: string, data: Blob): Promise<any> {
        let log: any = { filepath, data };
        try {
          if (!filepath.startsWith('/')) filepath = '/' + filepath;
          const base64Data = await this.blobToBase64(data);
          const options: WriteFileOptions = {
            path: `${this.config.STORAGE_FOLDER}/${filepath}`,
            directory: this.h_directory,
            recursive: true,
            data: base64Data,
          };
          log.options = options;
          const res = await Filesystem.writeFile(options);
          log.res = res;
          return res;
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
            appService.log('[file.service] saveFile', log, this.h_debug);
        }
    }
    
    public async saveFileSafe(filepath: string, data: Blob): Promise<any> {
        let log: any = { filepath, data };
        try {
          let found = true;
          let num = 0;
          let filepathCheck = '';
          while (found) {
            filepathCheck = filepath + (num === 0 ? '' : ` (${num})`);
            const res = await this.checkPath(filepathCheck);
            found = res !== null;
            num++;
          }
          return await this.saveFile(filepathCheck, data);
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
            appService.log('[file.service] saveFileSafe', log, this.h_debug);
        }
      }
    
    public async openFile(uri: string, mimeType?: string) {
        let log: any = { uri, mimeType };
        try {
          if (this.app.isWeb()) {
            throw { error: true, msg: 'Web không hỗ trợ mở tệp tin!' };
          }
          const options: FileOpenerOptions = {
            filePath: uri,
            contentType: mimeType,
            openWithDefault: true,
          };
          log.fileOpenerOptions = options;
          await FileOpener.open(options);
        } catch (e: any) {
          log.exception = e;
          if (e.code === '8') throw { error: true, msg: `Thiết bị không hỗ trợ xem tệp "${mimeType || ''}"!` };
          if (e.code === '9') throw { error: true, msg: 'Không tìm thấy tệp tin!' };
          throw e;
        } finally {
            appService.log('[file.service] openFile', log, this.h_debug);
        }
    }

    public async readFile(filepath: string, isBase64 = true, inApp = true): Promise<any> {
        let log: any = { filepath };
        try {
          let base64 = '';
          let blob: Blob | null = null;
    
          if (this.app.isWeb()) {
            if (filepath.startsWith('blob:')) {
              blob = await fetch(filepath).then(r => r.blob()).catch(() => null);
              if (isBase64 && blob) base64 = await this.blobToBase64(blob);
            } else {
              const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open('Disc', 1);
                request.onerror = reject;
                request.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
              });
    
              const transaction = db.transaction(['FileStorage'], 'readonly');
              const store = transaction.objectStore('FileStorage');
              const fullPath = inApp ? `/${this.h_directory}/${this.config.STORAGE_FOLDER}${filepath}` : filepath;
    
              const content = await new Promise<any>((resolve, reject) => {
                const request = store.get(fullPath);
                request.onsuccess = e => {
                    const req = e.target as IDBRequest<any>;
                    resolve(req.result?.content || null);
                  };
                request.onerror = reject;
              });
    
              if (typeof content === 'string') {
                base64 = content;
                if (!isBase64) blob = this.base64ToBlob(base64);
              } else if (content instanceof Blob) {
                blob = content;
                if (isBase64) base64 = await this.blobToBase64(blob);
              }
            }
          } else {
            const opts: ReadFileOptions = {
              path: inApp ? `${this.config.STORAGE_FOLDER}/${filepath}` : filepath,
              directory: inApp ? this.h_directory : undefined,
            };
            log.opts = opts;
    
            const resRead = await Filesystem.readFile(opts);
            log.resRead = resRead;
    
            if (isBase64) {
              base64 = typeof resRead.data === 'string' ? resRead.data : await this.blobToBase64(resRead.data);
            } else {
              blob = typeof resRead.data === 'string' ? this.base64ToBlob(resRead.data) : resRead.data;
            }
          }
    
          return isBase64 ? base64 : blob;
        } catch (e: any) {
          log.error = e;
          if (e?.message === 'File does not exist') {
            throw { error: true, msg: 'Không tìm thấy tệp tin!' };
          }
          throw e;
        } finally {
          this.app.log('[file.service] readFile', log, this.h_debug);
        }
    }

    public async browseFile(options: {
        limit?: number;             // Số lượng file giới hạn (0 = không giới hạn)
        readData?: boolean;         // Có đọc base64 hay không
        types?: string[];           // MIME types: ['image/png', 'application/pdf']
      } = {}): Promise<any[]> {
        const log: any = { options };
        try {
          const accept = (options.types || []).join(',');
          const allowMultiple = !options.limit || options.limit > 1;
      
          return await new Promise<any[]>((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = allowMultiple;
            if (accept) input.accept = accept;
      
            input.onchange = async () => {
              const files = Array.from(input.files || []);
      
              const limitedFiles = options.limit && options.limit > 0
                ? files.slice(0, options.limit)
                : files;
      
              const result = await Promise.all(limitedFiles.map(async (file) => {
                const blob = file;
                let base64 = '';
      
                if (options.readData) {
                  base64 = await this.blobToBase64(blob);
                }
      
                return {
                  name: file.name,
                  size: file.size,
                  mimeType: file.type,
                  blob,
                  ...(options.readData ? { data: base64 } : {}),
                };
              }));
      
              resolve(result);
            };
      
            input.onerror = reject;
            input.click();
          });
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
          appService.log('[file.service] browseFile (web-only)', log, this.h_debug);
        }
    }
      

    public async deleteFile(filepath: string) {
        let log: any = { filepath };
        try {
    
          if (this.app.isWeb()) {
    
            // Đọc từ IndexedDB
            const dbName: string = 'Disc';
            const storeName: string = 'FileStorage';
    
            let db: any = await new Promise<any>((resolve, reject) => {
              const request: IDBOpenDBRequest = window.indexedDB.open(dbName, 1);
              request.onerror = (event: any) => reject(event);
              request.onsuccess = (event: any) => resolve(event.target.result);
            });
    
            const transaction = db.transaction([storeName], 'readwrite');
            transaction.oncomplete = () => db.close();
    
            const objectStore = transaction.objectStore(storeName);
    
            await new Promise<void>((resolve, reject) => {
              let fullPath: string = '/'+this.h_directory+'/'+filepath;
              const deleteRequest = objectStore.delete(fullPath);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = (event: any) => reject(event);
            });
          }
          else {
    
            // Prepare options
            let options: DeleteFileOptions = {
              path: this.config.STORAGE_FOLDER + '/' + filepath,
              directory: this.h_directory,
            };
            log.options = options;
    
            // Call Native - Delete file
            await Filesystem.deleteFile(options);
          }
        }
        catch (e: any) {
          log.error = e;
          if (e.message == 'File does not exist')
            throw { error: true, msg: "Không tìm thấy tệp trên thiết bị!", detail: log.options };
          throw e;
        }
        finally {
          this.app.log('[file.service] deleteFile', log, this.h_debug);
        }
      }
      public async deleteFolder(folderpath: string) {
        let log: any = { folderpath };
        try {
    
          if (this.app.isWeb()) {
    
            // Đọc từ IndexedDB
            const dbName: string = 'Disc';
            const storeName: string = 'FileStorage';
    
            let db: any = await new Promise<any>((resolve, reject) => {
              const request: IDBOpenDBRequest = window.indexedDB.open(dbName, 1);
              request.onerror = (event: any) => reject(event);
              request.onsuccess = (event: any) => resolve(event.target.result);
            });
    
            const transaction = db.transaction([storeName], 'readwrite');
            transaction.oncomplete = () => db.close();
    
            const objectStore = transaction.objectStore(storeName);
    
            let fullPath: string = '/' + this.h_directory + '/' + this.config.STORAGE_FOLDER + '/' + folderpath;
            if (folderpath == this.config.STORAGE_FOLDER)
              fullPath = '/' + this.h_directory + '/' + this.config.STORAGE_FOLDER;
    
            // Xóa folder
            await new Promise<void>((resolve, reject) => {
              const deleteRequest = objectStore.delete(fullPath);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = (event: any) => reject(event);
            });
    
            // Xóa đệ quy
            fullPath += '/';
            await new Promise<void>((resolve, reject) => {
              const range = IDBKeyRange.bound(fullPath, fullPath+"\uffff", false, true);
              const cursorRequest = objectStore.openCursor(range);
    
              cursorRequest.onsuccess = (event: any) => { // Xóa toàn bộ folder
                const cursor = event.target.result;
                if (cursor) {
                  cursor.delete();
                  cursor.continue();
                }
                else
                  resolve();
              };
              cursorRequest.onerror = (event: any) => reject(event);
            });
          }
          else {
    
            if (folderpath != this.config.STORAGE_FOLDER)
              folderpath = this.config.STORAGE_FOLDER + '/' + folderpath;
    
            // Prepare Options
            let options: RmdirOptions = {
              path: folderpath,
              directory: this.h_directory,
              recursive: true,
            };
    
            // Call Native - Delete Folder
            await Filesystem.rmdir(options);
          }
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[file.service] deleteFolder', log, this.h_debug);
        }
      }
      public async listFile(folderPath: string, read: boolean = false): Promise<any[]> {
        let log: any = { folderPath };
        try {
          if (this.app.isWeb()) { // Web
    
            const dbName = 'Disc';
            const storeName = 'FileStorage';
            // const indexName = 'by_folder';
    
            // Mở IndexedDB
            let db: any = await new Promise<any>((resolve, reject) => {
              const request = window.indexedDB.open(dbName, 1);
              request.onerror = (event: any) => reject(event);
              request.onsuccess = (event: any) => resolve(event.target.result);
              // request.onupgradeneeded = (event: any) => {
              //   console.log("indexedDB onupgradeneeded", event);
              //   // db = event.target.result;
              //   // if (!db.objectStoreNames.contains(storeName)) {
              //   //   db.createObjectStore(storeName, { keyPath: "id" });
              //   // }
              // };
            });
            log.db = db;
    
            const transaction = db.transaction([storeName], "readonly");
            log.transaction = transaction;
            const objectStore = transaction.objectStore(storeName);
            log.objectStore = objectStore;
            // const index = objectStore.index(indexName);
            // log.index = index;
            const fullPath = '/' + this.h_directory + '/'+this.config.STORAGE_FOLDER + '/' + folderPath;
    
            // Duyệt qua thư mục
            let lstFile: any[] = await new Promise<any[]>((resolve, reject) => {
              let res: any[] = [];
              // const request = index.openCursor(IDBKeyRange.only(fullPath));
              const request = objectStore.openCursor(IDBKeyRange.only(fullPath));
              request.onerror = (event: any) => reject(event.target.error);
              request.onsuccess = async (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                  const fileData = cursor.value;
                  res.push({
                    blob: fileData.content,
                    name: this.getFilenameFromFullpath(fileData.path),
                    path: fileData.path,
                    size: fileData.size,
                    createTime: fileData.ctime,
                    modifyTime: fileData.mtime,
                  });
                  cursor.continue(); // Tiếp tục duyệt
                }
                else
                  resolve(res);
              };
            })
            log.lstFile = lstFile;
    
            // Convert Base64
            if (read) {
              for (let file of lstFile) {
                let ext = this.getExt(file.path);
                let mimetype = this.getMimeType(ext);
                let base64 = await this.blobToBase64(file.blob);
                file.base64 = this.getPrefixBlod(mimetype) + base64;
              }
            }
    
            return lstFile;
          }
          else { // Mobile
            throw { warning: true, msg: "Mobile chưa hỗ trợ listFile!" }
          }
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[file.service] listFile', log, this.h_debug);
        }
      }

    // Handler
    public getFilename(filepath: string): string {
        const path = filepath.split('/');
        return path.length > 1 ? path[path.length - 1] : filepath;
    }

    public getExt(filename: string): string {
        if (!filename) return '';
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }
    
    public getMimeType(ext: string): string {
        if (!this.m_mimeType) {
          this.m_mimeType = {
            // Image
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            // Audio
            ogg: 'audio/ogg',
            // Documents
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Compressed
            zip: 'application/zip',
            rar: 'application/vnd.rar',
          };
        }
    
        const mimetype = this.m_mimeType[ext.toLowerCase()];
        if (!mimetype) {
          throw { error: true, msg: `Mimetype không hỗ trợ! ${ext}` };
        }
        return mimetype;
    }
    
    public getFilenameFromFullpath(path: string): string {
        const pos = path.lastIndexOf('/');
        return pos === -1 ? path : path.substring(pos + 1);
      }
    
      public getIcon(ext: string): string {
        ext = ext.toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        else if (ext === 'docx') ext = 'doc';
        return `assets/icon/file-${ext}.svg`;
    }


    // Convert
    public dataUrlToBlob(dataUrl: string): Blob {
        const [header, base64] = dataUrl.split(',');
        const mimeString = header.split(':')[1].split(';')[0];
        return this.base64ToBlob(base64, mimeString);
    }

    public base64ToBlob(base64: string, mimetype: string = '', sliceSize: number = 512): Blob {
        if (base64.startsWith('data:')) {
          const pos = base64.indexOf('base64');
          mimetype = base64.substring(5, pos - 1);
          base64 = base64.substring(pos + 7);
        }
    
        let byteCharacters: string = '';
        try {
          byteCharacters = atob(base64);
        } catch (e: any) {
          throw { error: true, detail: e, msg: 'Chuỗi Base64 không hợp lệ' };
        }
    
        const byteArrays: Uint8Array[] = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
    
        return new Blob(byteArrays, { type: mimetype });
    }
    
    public blobToBase64(blob: Blob): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
    }

    public getPrefixBlod(mimetype: string): string {
        return 'data:'+mimetype+';base64,';
    }

    // Attachment Action
    public async attachment_exist(att: any) {
        let log: any = { att };
        try {
    
          let filepath: string = att.filePath + '/' + att.fileName;
          let stat = await this.checkPath(filepath);
          log.stat = stat;
    
          // Save to attachment
          att._exist = (stat != null);
          if (att._exist)
            att._uri = stat.uri;
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[file.service] attachment_exist', log, this.h_debug);
        }
      }
      public async attachment_download(att: any): Promise<string> {
        let log: any = {};
        try {
    
          // Start download
          let response = await this.api.downloadAttachmentAsync(this.api.getFS() + '/' + att.downloadPath);
          log.response = response;
    
          // Save File
          let fileStat = await this.saveFileSafe(att.downloadPath, response);
          log.fileStat = fileStat;
    
          return fileStat?.uri || '';
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          this.app.log('[file.service] attachment_download', log, this.h_debug);
        }
    }

    public async attachment_upload(syntax: string, recordId: number = -1, opts: any = {}): Promise<any> {
        /** opts:
         *   - addWatermark: Convert DOCX to PDF
         */
        let log: any = { syntax, recordId, opts };
        try {
    
          // Chọn file
          let fileSelect = await this.browseFile({ limit: 1, readData: true });
          log.fileSelect = fileSelect;
    
          if (fileSelect.length == 0) // Bỏ qua nếu ko chọn
            return null;
    
          // Show Loading
          await this.show.showLoading("Đang tải lên...");
    
          // Compile file
          let filePicker = fileSelect[0];
          let blob = filePicker.blob;
          if (blob == null) {
            let base64Data: string = filePicker.data || '';
            blob = this.base64ToBlob(base64Data, filePicker.mimeType);
          }
          let file = new File([blob], filePicker.name, { type: filePicker.mimeType });
          log.file = file;
    
          // Upload
          let resUpload = await this.api.uploadAttachment(syntax, [file], opts);
          log.resUpload = resUpload;
          if (resUpload == null || resUpload.length == 0)
            throw { error: true, msg: "Tải lên thất bại!" };
          let att = resUpload[0];
    
          // Update ObjectId
          if (recordId != -1)
            await this.api.updateAttachment([att.id], recordId);
    
          // Clone file into app folder
          let stat = await this.checkPath(att.filePath + '/' + att.fileName);
          if (stat == null) {
            let filePath = att.filePath + '/' + att.fileName;
            let resSave = await this.saveFile(filePath, blob);
    
            // Set State Attachment
            att._exist = (resSave != null);
            if (att._exist)
              att._uri = resSave.uri;
          }
          else {
    
            // Set State Attachment
            att._exist = true;
            att._uri = stat.uri;
          }
    
          return att;
        }
        catch (e: any) {
          log.error = e;
          throw e;
        }
        finally {
          await this.show.showLoading(); // Hide loading
          this.app.log('[file.service] attachment_upload', log, this.h_debug);
        }
    }
}

const fileService = new FileService(configService, appService, apiService, ShowService);
export default fileService;
