import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import appService from './appService';

class BiometricService {
  private h_debug = false;

  private m_available = false;
  private m_biometryType = 0; // None:0, Touch:1(IOS), Face:2(IOS), Fingerprint:3(Android), Face:4(Android), Iris:5(Android), Multi:6(Android)

  constructor() {}

  public async checkAvailable() {
    if (appService.isWeb()) {
      this.m_available = false;
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      this.m_available = result.isAvailable;
      this.m_biometryType = result.biometryType;

      appService.log('[biometric.service] checkAvailable', {
        result,
        m_available: this.m_available,
      }, this.h_debug);
    } catch (error) {
      this.m_available = false;
      appService.log('[biometric.service] checkAvailable error', { error }, this.h_debug);
    }
  }

  public async authenticate(opts?: any): Promise<boolean> {
    let log: any = { opts };

    try {
      if (!opts) opts = {};

      // Lấy text nút đóng từ i18n qua appService
      opts.negativeButtonText = await appService.lang('common.close');

      let result = false;
      try {
        await NativeBiometric.verifyIdentity(opts);
        result = true;
      } catch (e: any) {
        let errMsg = '';
        switch (e.code) {
          case "0": errMsg = "Lỗi không xác định"; break;
          case "1": errMsg = "Sinh trắc học không khả dụng"; break;
          case "2": errMsg = "Khóa người dùng"; break;
          case "3": errMsg = "Sinh trắc học chưa được ghi danh"; break;
          case "4": errMsg = "Khóa tạm thời của người dùng (Android)"; break;
          case "10": break; // Xác thực không thành công
          case "11": errMsg = "Hủy ứng dụng"; break;
          case "12": errMsg = "Bối cảnh không hợp lệ"; break;
          case "13": errMsg = "Không tương tác"; break;
          case "14": errMsg = "Mật mã chưa được thiết lập"; break;
          case "15": errMsg = "Hủy bỏ hệ thống"; break;
          case "16": break;
          case "17": errMsg = "Người dùng dự phòng"; break;
          default: throw e;
        }
        if (errMsg.length > 0) throw { error: true, msg: errMsg };
      }

      return result;
    } catch (e: any) {
      log.error = e;
      throw e;
    } finally {
      appService.log('[biometric.service] authenticate', log, this.h_debug);
    }
  }

  // Getters
  public isAvailable() {
    return this.m_available;
  }

  public getType() {
    return this.m_biometryType;
  }
}

const biometricService = new BiometricService();
export default biometricService;
