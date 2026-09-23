import { writable } from 'svelte/store';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<ToastMessage[]>([]);

  function show(type: ToastMessage['type'], message: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, duration };

    update((toasts) => [...toasts, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }

  function dismiss(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    show,
    success: (msg: string, duration?: number) => show('success', msg, duration),
    error: (msg: string, duration?: number) => show('error', msg, duration),
    info: (msg: string, duration?: number) => show('info', msg, duration),
    warning: (msg: string, duration?: number) => show('warning', msg, duration),
    dismiss,
  };
}

export const toast = createToastStore();
