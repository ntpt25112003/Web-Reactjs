import configService from './configService';
import appService  from './appService';
import {apiService} from './apiService';
// import firebaseService  from './firebaseService';
import userService from './userService';
import menuService from './menuService';
import showService  from './showService';

class DevService {
    private h_debug = false;
  
    constructor(
      private config = configService,
      private app = appService,
      private api = apiService,
      private user = userService,
      private menu = menuService,
      private show = showService
    ) {}
  
    async reloadCache() {
      if (!this.user.isLogin()) {
        this.user.setIsLogin(true);
        await this.user.loadCache();
        await this.menu.loadCache();
        await this.api.loadCache();
  
        if (this.config.DEBUG) {
          const url = window.location.pathname;
          this.app.m_moduleNumber = (url.startsWith('/logtime/') || url.startsWith('/task/')) ? 2 : 1;
        }
  
        this.app.log('[dev.service] reloadCache: Loaded', {}, this.h_debug);
      } else {
        this.app.log('[dev.service] reloadCache: No Loaded', {}, this.h_debug);
      }
    }
  
    async exception(exception: any, message?: string, title?: string) {
      this.app.log('[dev.service] exception', {
        typeof_exception: typeof exception,
        exception,
      }, this.h_debug);
  
      let type = 'error';
      const buttons: any[] = [];
  
      try {
        if (exception) {
          if (typeof exception === 'string') {
            message = exception.includes('.') && !exception.includes(' ')
              ? await this.app.lang(exception)
              : exception;
          } else if (typeof exception === 'object') {
            if (exception instanceof TypeError) {
              message = exception.message === 'Failed to fetch'
                ? await this.app.lang('exception.server_not_responding')
                : exception.message;
            } else if (exception.error) {
              switch (exception.process) {
                case 'OVER_SESSION':
                  message = await this.app.lang('exception.session_over');
                  await this.api.cleanCache();
                  await this.menu.cleanCache();
                  await this.user.logout();
                  break;
                case 'BAD_GATEWAY':
                  message = "Bad gateway!";
                  break;
                default:
                  title = exception.title ?? title;
                  message = exception.msgCode
                    ? await this.app.lang(exception.msgCode)
                    : (exception.msg?.includes(' ') ? exception.msg : await this.app.lang(exception.msg));
              }
            } else if (exception.warning) {
              type = 'warning';
              message = exception.msg?.includes(' ') ? exception.msg : await this.app.lang(exception.msg);
            } else if (exception.status === 401) {
              message = await this.app.lang('exception.session_over');
              await this.api.cleanCache();
              await this.menu.cleanCache();
              await this.user.logout();
            } else if (exception.status === 200) {
              const result = exception.data?.result;
              if (result?.isSucceeded === false && result.message) {
                message = await this.app.lang('exception.server_error', { message: result.message });
              }
            } else if (exception.status === 500 && exception.data?.success === false) {
              const error = exception.data.error;
              if (error?.detail?.length > 0) {
                message = await this.app.lang('exception.server_error', { message: error.detail });
              }
              if (error?.message?.length > 0) {
                title = title ?? error.message;
                message = message ?? await this.app.lang('exception.server_error', { message: error.message });
              }
            }
          }
        }
  
        // Fallback
        if (!message) {
          message = await this.app.lang('common.err_process');
          buttons.push({
            text: await this.app.lang('common.detail'),
            role: 'detail',
            side: 'end',
            handler: () => this.app.go('/dev/logerror', exception)
          });
        } else if (exception?.detail) {
          buttons.push({
            text: await this.app.lang('common.detail'),
            role: 'detail',
            side: 'end',
            handler: () => this.app.go('/dev/logerror', exception.detail)
          });
        }
  
        this.show.toast(type as'success' | 'warning' | 'error' | 'info', message, { header: title, buttons });
      } catch (e) {
        this.app.log('[dev.service] exception - internal error', { e }, true);
      }
    }
  }
  
  const devService = new DevService(configService, appService, apiService, userService, menuService, showService);
  export default devService;