export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

export interface ToastPayload {
  message: string;
  duration?: number;
  action?: ToastAction;
}

type ToastListener = (toast: ToastPayload | null) => void;

export class ToastService {
  private listeners: Set<ToastListener> = new Set();
  private currentToast: ToastPayload | null = null;

  show(message: string, options?: ToastOptions): void {
    this.currentToast = {
      message,
      duration: options?.duration ?? 3000,
      action: options?.action,
    };
    this.notify();
  }

  hide(): void {
    this.currentToast = null;
    this.notify();
  }

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.currentToast);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentToast(): ToastPayload | null {
    return this.currentToast;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentToast);
    }
  }
}

export const toastService = new ToastService();
