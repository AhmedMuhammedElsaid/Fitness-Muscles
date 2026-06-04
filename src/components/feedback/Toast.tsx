import * as Burnt from 'burnt';
import i18n from '@/lib/i18n';

type ToastOptions = {
  message?: string;
  duration?: number;
};

function show(preset: 'done' | 'error' | 'none', key: string, options?: ToastOptions): void {
  Burnt.toast({
    title: i18n.t(key),
    message: options?.message,
    preset,
    duration: options?.duration,
  });
}

export const toast = {
  success: (key: string, options?: ToastOptions) => show('done', key, options),
  error: (key: string, options?: ToastOptions) => show('error', key, options),
  info: (key: string, options?: ToastOptions) => show('none', key, options),
};
