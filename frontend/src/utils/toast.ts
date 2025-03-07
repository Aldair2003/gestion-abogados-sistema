import { toast } from 'react-toastify';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastFunction {
  (type: ToastType, message: string): void;
  success(title: string, message?: string): void;
  error(title: string, message?: string): void;
  warning(title: string, message?: string): void;
  info(title: string, message?: string): void;
}

const createToast = (type: ToastType, title: string, message?: string) => {
  toast[type](message || title, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const showToast = ((type: ToastType, message: string) => {
  createToast(type, message);
}) as ToastFunction;

showToast.success = (title: string, message?: string) => createToast('success', title, message);
showToast.error = (title: string, message?: string) => createToast('error', title, message);
showToast.warning = (title: string, message?: string) => createToast('warning', title, message);
showToast.info = (title: string, message?: string) => createToast('info', title, message); 