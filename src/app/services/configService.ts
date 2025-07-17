class ConfigService {
    public SITE_REL = false; // Triển khai môi trường thực tế
    public SITE_TEST = false; // Triển khai môi trường test
  
    public DEBUG = true; // Log Function
    public TRACE = false; // Trace Log Function
  
    // General
    public readonly SITE_CODE = 'QLVBSYT';
    public readonly SITE_ID = 109;
    public readonly SITE_CODE_2 = 'HRM'; // 108
    public readonly SITE_ID_2 = 108;
    public readonly DATASOURCE = 'QLVBSYT'; // 66
    public readonly DATASOURCE_2 = 'DICHVUCONG'; // 72
    public readonly DATASOURCE_CHAT = 'PORTAL_CHAT'; // 56
    public readonly STORAGE_FOLDER = 'BV175_EOFFICE';
    public readonly DEEPLINK = 'hinnova://bv175.eoffice/';
  
    // Site Dev
    public readonly BE_DEV_URL = 'http://localhost:5000';
    public readonly B2_DEV_URL = 'https://localhost:5003';
    public readonly FE_DEV_URL = 'http://192.168.1.232:4554';
    public readonly FS_DEV_URL = 'http://192.168.1.232:4553';
    public readonly DATASOURCE_CONFIG_DEV = 'SITE_PORTAL';
  
    // Site Test
    public readonly BE_TEST_URL = 'https://hinnova.vn:4552'; // #BV7A
    public readonly B2_TEST_URL = 'https://hinnova.vn:4552'; // #BV7A
    public readonly FE_TEST_URL = 'https://hinnova.vn:4554'; // #BV7A
    public readonly FS_TEST_URL = 'https://hinnova.vn:4553'; // #BV7A
    public readonly DATASOURCE_CONFIG_TEST = 'SITE_PORTAL';
  
    // Site Real
    public readonly BE_REL_URL = 'https://portal-apis.benhvien175.vn';
    public readonly B2_REL_URL = 'https://portal-apis.benhvien175.vn';
    public readonly FE_REL_URL = 'https://portal.benhvien175.vn';
    public readonly FS_REL_URL = 'https://portal-files.benhvien175.vn';
    public readonly DATASOURCE_CONFIG_REL = 'PORTAL';
  
    // Firebase
    public readonly FIREBASE_PASSWORD = 'rJAtpU3mAhf6eaL25dwHATDFCDAwEM';
    public readonly FIREBASE_CONFIG = {
      apiKey: "AIzaSyCM5DCLLRCuw2j78zDRt1pnDajmoV_Sjlc",
      authDomain: "bv175-eoffice.firebaseapp.com",
      databaseURL: "https://bv175-eoffice-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "bv175-eoffice",
      storageBucket: "bv175-eoffice.firebasestorage.app",
      messagingSenderId: "516629706709",
      appId: "1:516629706709:web:258904fc80330b67ebaf5c"
    };
  
    // CH Play (Android)
    public readonly CH_PLAY_APP_ID = 'com.hinnova.dhd.v2';
  
    // Default
    public readonly DEFAULT_LANG = 'vi';
    public readonly DEFAULT_AVATAR = '/icon/avatar.svg';
    public readonly DEFAULT_AVATAR_GROUP = '/icon/group.png';
  
    // Home Page
    public readonly HOME_WIDGET_CONFIG = 'TOTAL_DOC,DOC_PROCESS,WEEKLY_MEET,DOC_RELEASED,IDOC_RESOLVED,STATIC_DOCQM,DOC_INFO';
  
    // Mã hóa
    public readonly randStr = '648687d7b880a47ef99b18354686998a'; // Len 32
  
    constructor() {}
  
    // Method
    public getUrlAppStore(langCode: string = this.DEFAULT_LANG): string {
      const appCode = ""; // "logasia"; // Xem trên app store connect
      const appId = -1; // 6670301700; // Vào App Store Connect -> App Infomation -> App ID
      const params = "?l=" + langCode;
      return `https://apps.apple.com/vn/app/${appCode}/id${appId}${params}`;
    }
  
    public getUrlChPlay(): string {
      const params = "?id=" + this.CH_PLAY_APP_ID;
      return `https://play.google.com/store/apps/details${params}`;
    }

    public getApiUrl(): string {
        if (this.SITE_REL) return this.BE_REL_URL;
        if (this.SITE_TEST) return this.BE_TEST_URL;
        return this.BE_DEV_URL;
      }
  }
  
  const configService = new ConfigService();
  export default configService;
  