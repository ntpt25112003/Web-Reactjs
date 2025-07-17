import toastService from './toastService';

class ShowService {
  private loadingRef: {
    show: (msg?: string, cb?: () => void) => void;
    hide: () => void;
  } | null = null;

  registerLoading(loadingRef: { show: (msg?: string, cb?: () => void) => void; hide: () => void }) {
    this.loadingRef = loadingRef;
  }

  toast(type: 'success' | 'warning' | 'error' | 'info', message: string, options?: any) {
    toastService[type](message);
  }

  showLoading(message?: string, onDismiss?: () => void) {
    console.log("[showService] showLoading:", message);
    this.loadingRef?.show(message, onDismiss);
  }

  hideLoading() {
    this.loadingRef?.hide();
  }

  alertAsync(message: string): Promise<boolean> {
    return Promise.resolve(window.confirm(message));
  }

}

const showService = new ShowService();
export default showService;
