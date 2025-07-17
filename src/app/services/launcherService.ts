import configService from './configService';
import appService from './appService';
import showService from './showService';

class LauncherService {
  private h_debug = false;

  constructor() {}

  // Xử lý deeplink
  public async deeplink(link: string) {
    try {
      const url = new URL(link);
      const paramsURL = new URLSearchParams(url.search);

      if (link.startsWith(configService.DEEPLINK + 'calendar')) {
        // Ví dụ: xử lý tham số LichId
        // const LichIdStr = paramsURL.get('LichId');
        // const LichId = LichIdStr ? parseInt(LichIdStr) : -1;
        // if (LichId > -1) {
        //   // Thực hiện điều hướng hoặc xử lý
        //   // await calendarService.goCalendar(LichId);
        // }
      }
    } catch (e) {
      appService.log('[launcher.service] deeplink error', { error: e }, this.h_debug);
    }
  }

  // Xử lý khi nhận notification
  public onReceive(notification: any) {
    // Ví dụ bạn có thể xử lý notification.data ở đây

    showService.toast('info', notification.title, {
      header: notification.body,
      position: 'top',
      duration: 5000,
      buttons: [{ icon: 'close-outline', side: 'end' }],
    });

    appService.log('[launcher.service] onReceive', { notification }, this.h_debug);
  }

  // Xử lý khi người dùng tương tác với notification
  public onAction(notification: any) {
    appService.log('[launcher.service] onAction', { notification }, this.h_debug);
  }

  // Xử lý các hành động local notification (ví dụ khi nhấn vào thông báo)
  public async onLocalAction(notificationAction: any) {
    const log: any = { notificationAction };
    try {
      // Ví dụ xử lý tham số từ notificationAction
      // const LichId = notificationAction?.notification?.extra?.LichId || -1;
      // if (LichId > -1) {
      //   await calendarService.goCalendar(LichId);
      // }
    } catch (e: any) {
      log.error = e;

      const buttons = [{
        text: await appService.lang('common.detail'),
        side: 'end',
        role: 'detail',
        handler: () => appService.go('/dev/logerror', e),
      }];

      const message = e.message || await appService.lang('common.err_process');

      showService.toast('error', message, { buttons });
    } finally {
      appService.log('[launcher.service] onLocalAction', log, this.h_debug);
    }
  }
}

const launcherService = new LauncherService();
export default launcherService;
