import { NativeModules, NativeEventEmitter, Platform } from "react-native";

interface NativeShareIntentModule {
  getInitialSharedUri(): Promise<string | null>;
  clearSharedUri(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const nativeModule = NativeModules?.ShareIntentModule as NativeShareIntentModule | undefined;
const eventEmitter = nativeModule ? new NativeEventEmitter(NativeModules.ShareIntentModule) : null;
const EVENT_NAME = "onSharedImageReceived";

export class ShareIntentService {
  public async getInitialSharedUri(): Promise<string | null> {
    if (Platform.OS !== "android" || !nativeModule) {
      return null;
    }
    try {
      return await nativeModule.getInitialSharedUri();
    } catch {
      return null;
    }
  }

  public async clearSharedUri(): Promise<boolean> {
    if (Platform.OS !== "android" || !nativeModule) {
      return false;
    }
    try {
      return await nativeModule.clearSharedUri();
    } catch {
      return false;
    }
  }

  public subscribeSharedImage(callback: (uri: string) => void): () => void {
    if (!eventEmitter) {
      return function () {};
    }
    const subscription = eventEmitter.addListener(EVENT_NAME, (uri: string) => {
      if (typeof uri === "string" && uri.length > 0) {
        callback(uri);
      }
    });
    return function () {
      subscription.remove();
    };
  }
}

export const shareIntentService = new ShareIntentService();
