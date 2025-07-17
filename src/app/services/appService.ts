import { Capacitor } from '@capacitor/core';
import { App, AppInfo } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { StorageKey } from './storageService';
import StorageService from './storageService';
import configService from './configService';
import i18n from 'i18next';
import { NavigateFunction } from 'react-router-dom';

interface VersionInfo {
  name: string;
  build: number;
}

interface NavAfterLogin {
  type: string;
  data: any;
}

class AppService {
  private h_debug = false;

  public m_appName = "VPDT SYT";
  public m_appId = "";
  private m_version: VersionInfo = { name: "1.0.0", build: 0 };
  public m_device: any = null;
  public m_language: string;
  public m_moduleNumber = 0;

  private nav_page = '';
  private nav_params: any = null;
  private nav_afterLogin: NavAfterLogin = { type: '', data: null };

  private navigate: NavigateFunction | null = null;

  constructor() {
    this.m_language = configService.DEFAULT_LANG;
  }

  // Thiết lập hàm navigate từ React Router để sử dụng trong service
  public setNavigateFunction(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  public async init(): Promise<void> {
    const log: any = {};

    // Language
    this.m_language = await StorageService.get(StorageKey.SETTING_LANG) || configService.DEFAULT_LANG;
    this.setLanguage(this.m_language);
    log.m_language = this.m_language;

    // Device info (nếu không phải web)
    if (!this.isWeb()) {
      this.m_device = {
        BatteryInfo: await Device.getBatteryInfo(),
        Id: await Device.getId(),
        Info: await Device.getInfo(),
        LanguageCode: await Device.getLanguageCode(),
        LanguageTag: await Device.getLanguageTag(),
      };
      log.m_device = this.m_device;
    }

    this.log('[AppService] init', log, this.h_debug);
  }

  public log(origin: string, data: any, enable = true) {
    if (!configService.DEBUG || !enable || data == null) return;

    const { error, warning, highlight } = data;

    if (error != null) {
      console.groupCollapsed(`%c${origin}`, 'color: #eb445a');
      delete data.error;
    } else if (warning != null) {
      console.groupCollapsed(`%c${origin}`, 'color: #ffc409');
      delete data.warning;
    } else if (highlight === true) {
      console.groupCollapsed(`%c${origin}`, 'color: #00ffff');
      delete data.highlight;
    } else {
      console.groupCollapsed(origin);
    }

    for (const prop in data) {
      console.log(`${prop}:`, data[prop]);
    }

    if (error != null) console.error('error:', error);
    else if (warning != null) console.warn('warning:', warning);

    if (configService.TRACE) console.trace();
    console.groupEnd();
  }

  // Platform checks
  public isWeb() {
    return Capacitor.getPlatform() === 'web';
  }
  public isAndroid() {
    return Capacitor.getPlatform() === 'android';
  }
  public isIOS() {
    return Capacitor.getPlatform() === 'ios';
  }
  public getPlatform() {
    return Capacitor.getPlatform();
  }
  public isNativePlatform() {
    return Capacitor.isNativePlatform();
  }

  // App version info
  public async getVersion(): Promise<VersionInfo> {
    if (this.m_version.build === 0) {
      if (this.isWeb()) {
        this.m_version.build = 1;
        return this.m_version;
      }

      const info: AppInfo = await App.getInfo();
      this.m_version = {
        name: info.version,
        build: parseInt(info.build),
      };

      this.log('[AppService] getVersion', {
        deviceBattery: await Device.getBatteryInfo(),
        deviceId: await Device.getId(),
        deviceInfo: await Device.getInfo(),
        deviceLanguageCode: await Device.getLanguageCode(),
        deviceLanguageTag: await Device.getLanguageTag(),
        appInfo: info,
      }, this.h_debug);
    }
    return this.m_version;
  }

  public getDevice() {
    return this.m_device;
  }

  public async getLaunchUrl() {
    return await App.getLaunchUrl();
  }

  // Navigation methods
  public async go(url: string, params?: any, opts?: { replace?: boolean }) {
    if (!this.navigate) {
      console.warn('Navigate function not set in AppService');
      return;
    }
    if (params != null) this.nav_params = params;

    if (opts?.replace) {
      this.navigate(url, { replace: true, state: params });
    } else {
      this.navigate(url, { state: params });
    }
  }

  public goWithParams(url: string, params: any) {
    if (!this.navigate) {
      console.warn('Navigate function not set in AppService');
      return;
    }
    this.navigate(url, { state: params });
  }

  public getUrl() {
    if (!this.navigate) return '';
    // React Router không có thuộc tính url trực tiếp trong service,
    // nên bạn cần lấy url từ component hoặc context
    return window.location.pathname;
  }

  public back(params?: any) {
    if (!this.navigate) {
      console.warn('Navigate function not set in AppService');
      return;
    }
    if (params != null) this.nav_params = params;
    window.history.back();
  }

  public async backUrl(params?: any) {
    let url = window.location.pathname;
    const pos = url.lastIndexOf('/');
    if (pos !== -1) url = url.substring(0, pos);
    else url = '/';

    await this.go(url, params);
  }

  // i18n translation

  public async lang(key: string, params?: any): Promise<string> {
    const result = i18n.t(key, params);
    return typeof result === 'string' ? result : key;
  }

  public langInstant(key: string): string {
    return i18n.t(key);
  }

  public setLanguage(language: string) {
    const lstLanguageSupport = ['en', 'vi'];
    if (!lstLanguageSupport.includes(language)) {
      language = configService.DEFAULT_LANG;
    }
    this.m_language = language;
    i18n.changeLanguage(language);
    StorageService.set(StorageKey.SETTING_LANG, language);
  }

  // Get / Set navigation params
  public getParams() {
    const params = this.nav_params;
    this.nav_params = null;
    return params;
  }

  public getAfterLogin() {
    const data = { ...this.nav_afterLogin };
    this.nav_afterLogin = { type: '', data: null };
    return data;
  }

  public setAfterLogin(type: string, data: any) {
    this.nav_afterLogin = { type, data };
  }

  // Utilities
  public async updateDOM(): Promise<void> {
    // Trong React, bạn dùng state hoặc forceUpdate hook để cập nhật UI
    // Nên hàm này có thể để trống hoặc gọi callback cập nhật UI từ component
    return Promise.resolve();
  }
}

const appService = new AppService();
export default appService;
