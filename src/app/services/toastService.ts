import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

class ToastService {
  success(message: string) {
    toast.success(message, { autoClose: 1000, position: 'bottom-center' });
  }
  warning(message: string) {
    toast.warning(message, { autoClose: 2000, position: 'bottom-center' });
  }
  error(message: string) {
    toast.error(message, { autoClose: 3000, position: 'bottom-center' });
  }
  info(message: string) {
    toast.info(message, { autoClose: 1000, position: 'bottom-center' });
  }
}

const toastService = new ToastService();
export default toastService;
