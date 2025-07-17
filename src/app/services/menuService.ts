import { menuController } from './menuController';
import storageService , { StorageKey} from './storageService';
import appService  from './appService';
import { apiService } from './apiService';

class MenuService {
    private h_debug = false;
    private m_menus: any[] = [];
  
    getMenu() {
      return this.m_menus;
    }
  
    getMenuByCode(_code: string) {
      return this.m_menus.find(m => m.code === _code) || null;
    }
  
    async setMenusFromAPI(isSave = false) {
      const log: any = {};
  
      try {
        const topMenus = await apiService.getAllTopMenu();
        log.topMenus = topMenus;
        if (!topMenus.length) throw { error: true, msg: "Không tìm thấy top menu cho mobile" };
  
        const menus: any[] = [];
  
        for (const topMenu of topMenus) {
          const resMenu = await apiService.getListLabel(topMenu.id);
          for (const menu of resMenu) {
            menus.push({
              ...menu,
              siteId: topMenu.siteId,
              current: false
            });
          }
        }
  
        log.resMenus = menus;
  
        if (!menus.length) throw { error: true, msg: "Không tìm thấy menu cho mobile" };
  
        menus.sort((a, b) => (a.index < b.index ? -1 : 1));
  
        const listMenu = menus.map(menu => {
          const colorIcon = menu.cssIconFormat ? JSON.parse(menu.cssIconFormat).color : undefined;
          const colorText = menu.textColor ? JSON.parse(menu.textColor).color : undefined;
  
          return {
            link: menu.link || '',
            code: menu.code,
            title: menu.title,
            icon: menu.icon,
            parent: menu.parent ?? 0,
            iframe: menu.iframe ?? null,
            siteId: menu.siteId,
            current: false,
            colorIcon,
            colorText
          };
        });
  
        // Add default
        const defaults = [
          { link: '/digital-sign', code: 'DIGITAL_SIGN', title: 'Cấu hình ký số', icon: 'key' },
          { link: '/contact', code: 'CONTACT', title: 'Danh bạ', icon: 'people-circle-outline' },
          { link: '/chat', code: 'CHAT', title: 'Nhắn tin', icon: 'chatbubble-ellipses-outline' },
        ].map(item => ({
          ...item,
          parent: 0,
          iframe: null,
          siteId: 109,
          current: false,
        }));
  
        this.m_menus = [...listMenu, ...defaults];
  
        if (isSave) {
          await storageService.set(StorageKey.MENU, this.m_menus);
        }
  
      } catch (e: any) {
        log.error = e;
        throw e;
      } finally {
        appService.log('[menu.service] setMenusFromAPI', log, this.h_debug);
      }
    }
  
    async loadCache() {
      this.m_menus = (await storageService.get(StorageKey.MENU, 'object')) || [];
      appService.log('[menu.service] loadCache', { m_menus: this.m_menus }, this.h_debug);
    }
  
    async cleanCache() {
      await storageService.remove(StorageKey.MENU);
    }
  
    getMenuFirst() {
      return this.m_menus.find(menu => menu.link && menu.link.length > 0) || null;
    }
  
    async updateMenuLanguage() {
      for (const m of this.m_menus) {
        switch (m.code) {
          case 'PROFILE':
            m.title = await appService.lang('menu.profile');
            break;
          case 'SETTING':
            m.title = await appService.lang('menu.setting');
            break;
          case 'DEV':
            m.title = await appService.lang('menu.development');
            break;
        }
      }
    }
  
    async enable(toggle: boolean) {
      await menuController.enable(toggle);
    }
  
    async open(toggle: boolean) {
      if (toggle) {
        await menuController.open();
      } else {
        await menuController.close();
      }
    }
  }
  
  const menuService = new MenuService();
  export default menuService;