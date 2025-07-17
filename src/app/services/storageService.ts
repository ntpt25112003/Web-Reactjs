export enum StorageKey {
  // Login
  LOGIN_USERNAME_LASTEST = 1,
  PASSWORD,
  LOGIN_STAYLOGIN,
  LOGIN_ACCOUNTS,

  // User
  TOKEN_BE,
  TOKEN_FE,
  TOKEN_FS,
  TOKEN_FB,
  USER,
  UNIT,
  ROLES,
  AVATAR,

  // Menu
  MENU,

  // API
  DATASOURCE,
  DATASOURCE_2,
  DATASOURCE_CONFIG,
  DATASOURCE_CHAT,

  // FIREBASE
  FB_USER,

  // Setting
  SETTING_FINGER,
  SETTING_LANG,
  SETTING_NOTIFY,
  SETTING_DARK_MODE,
  SETTING_DASHBOARD_FUNCTION,
  SETTING_DASHBOARD_TODO,
}

class StorageService {
  private readonly h_debug = false;

  // Helper: dynamic import Preferences
  private async getPreferences() {
    if (typeof window === 'undefined') return null;
    const mod = await import('@capacitor/preferences');
    return mod.Preferences;
  }

  public async get(
    key: StorageKey,
    datatype: 'string' | 'number' | 'boolean' | 'object' = 'string'
  ): Promise<any> {
    const Preferences = await this.getPreferences();
    if (!Preferences) return null;

    const res = await Preferences.get({ key: key.toString() });
    if (!res || res.value == null) return null;

    let value: any = res.value;

    switch (datatype) {
      case 'number':
        value = +value;
        break;
      case 'boolean':
        value = value === 'true';
        break;
      case 'object':
        try {
          value = JSON.parse(value);
        } catch (e) {
          if (this.h_debug) console.warn('JSON parse error for key:', key, e);
          value = null;
        }
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
    const Preferences = await this.getPreferences();
    if (!Preferences) return;

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
    const Preferences = await this.getPreferences();
    if (!Preferences) return;

    await Preferences.remove({ key: key.toString() });
  }

  public async clear(): Promise<void> {
    const Preferences = await this.getPreferences();
    if (!Preferences) return;

    await Preferences.clear();
  }
}

const storageService = new StorageService();
export default storageService;
