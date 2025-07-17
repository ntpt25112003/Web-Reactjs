import { Preferences, GetResult } from '@capacitor/preferences';

export enum StorageKey {
  // Login
  LOGIN_USERNAME_LASTEST = 1, // String
  PASSWORD, // String
  LOGIN_STAYLOGIN, // Boolean
  LOGIN_ACCOUNTS, // Object Map: {username1:password1, username2:password2}

  // User
  TOKEN_BE, // String Back-End Token
  TOKEN_FE, // String Front-End Token
  TOKEN_FS, // String File server Token
  TOKEN_FB, // String Firebase Token
  USER, // Object User
  UNIT, // Object Unit
  ROLES, // List Object Role
  AVATAR, // String url

  // Menu
  MENU, // List Object Menu

  // API
  DATASOURCE, // Number - DatasourceId
  DATASOURCE_2, // Number - DatasourceId
  DATASOURCE_CONFIG, // Number - DatasourceId
  DATASOURCE_CHAT, // Number - DatasourceId

  // FIREBASE
  FB_USER, // Object User

  // Setting
  SETTING_FINGER, // Boolean
  SETTING_LANG, // String
  SETTING_NOTIFY, // Boolean
  SETTING_DARK_MODE, // Boolean
  SETTING_DASHBOARD_FUNCTION, // List Widget Group
  SETTING_DASHBOARD_TODO, // List Widget Item
}

class StorageService {
  private readonly h_debug = false;

  constructor() {}

  public async get(key: StorageKey, datatype: 'string' | 'number' | 'boolean' | 'object' = 'string'): Promise<any> {
    const res: GetResult = await Preferences.get({ key: key.toString() });

    if (!res || res.value == null) return null;

    let value: any = res.value;

    switch (datatype) {
      case 'number':
        value = +value;
        break;
      case 'boolean':
        value = (value === 'true');
        break;
      case 'object':
        try {
          value = JSON.parse(value);
        } catch (e) {
          if (this.h_debug) console.warn('JSON parse error for key:', key, e);
          value = null;
        }
        break;
      default:
        // string giữ nguyên
        break;
    }

    if (this.h_debug) {
      console.groupCollapsed('[storageService] get:', StorageKey[key]);
      console.log('value:', value);
      console.trace();
      console.groupEnd();
    }

    return value;
  }

  public async set(key: StorageKey, value: any): Promise<void> {
    if (value != null) {
      if (typeof value === 'number' || typeof value === 'boolean') {
        value = String(value);
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
    }

    await Preferences.set({ key: key.toString(), value });

    if (this.h_debug) {
      console.groupCollapsed('[storageService] set:', StorageKey[key]);
      console.log('value:', value);
      console.groupEnd();
    }
  }

  public async remove(key: StorageKey): Promise<void> {
    await Preferences.remove({ key: key.toString() });
  }

  public async clear(): Promise<void> {
    await Preferences.clear();
  }
}

const storageService = new StorageService();
export default storageService;
