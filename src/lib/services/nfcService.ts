import { Platform } from "react-native";
import NfcManager, {
  Ndef,
  NfcError,
  NfcTech,
  type TagEvent,
} from "react-native-nfc-manager";

export type NfcTagErrorCode =
  | "unsupported"
  | "disabled"
  | "cancelled"
  | "not-writable"
  | "too-small"
  | "not-ndef"
  | "tag-lost"
  | "busy"
  | "lock-failed"
  | "unknown";

export class NfcTagError extends Error {
  readonly code: NfcTagErrorCode;

  constructor(code: NfcTagErrorCode, message: string) {
    super(message);
    this.name = "NfcTagError";
    this.code = code;
  }
}

export interface NfcTagOptions {
  alertMessage?: string;
}

export interface NfcWriteResult {
  uri: string;
  encodedSize: number;
  maxSize?: number;
  tagId?: string;
}

export interface NfcLockResult {
  tagId?: string;
}

type NfcTagOperation = "write" | "lock";

const DEFAULT_ALERT_MESSAGE = "Hold your phone near the NFC tag";

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function toNfcTagError(
  error: unknown,
  operation: NfcTagOperation,
): NfcTagError {
  if (error instanceof NfcTagError) return error;

  if (error instanceof NfcError.UserCancel) {
    return new NfcTagError("cancelled", "Operation cancelled.");
  }
  if (error instanceof NfcError.UnsupportedFeature) {
    return new NfcTagError(
      "unsupported",
      "This device doesn't support NFC tag writing.",
    );
  }
  if (error instanceof NfcError.RadioDisabled) {
    return new NfcTagError(
      "disabled",
      "NFC is turned off. Enable it in your device settings.",
    );
  }
  if (error instanceof NfcError.TagNotWritable) {
    return new NfcTagError(
      "not-writable",
      operation === "lock"
        ? "This tag is already read-only or can't be locked."
        : "This NFC tag is read-only.",
    );
  }
  if (
    error instanceof NfcError.TagSizeTooSmall ||
    error instanceof NfcError.PacketTooLong
  ) {
    return new NfcTagError(
      "too-small",
      "This tag doesn't have enough space for the link.",
    );
  }
  if (error instanceof NfcError.FirstNdefInvalid) {
    return new NfcTagError(
      "not-ndef",
      "This tag isn't NDEF-formatted. Use a blank, NDEF-compatible tag.",
    );
  }
  if (error instanceof NfcError.TagUpdateFailure) {
    return new NfcTagError(
      "lock-failed",
      "The tag rejected the lock request. It may be protected by the manufacturer.",
    );
  }
  if (
    error instanceof NfcError.TagConnectionLost ||
    error instanceof NfcError.RetryExceeded ||
    error instanceof NfcError.TagResponseError ||
    error instanceof NfcError.SessionInvalidated ||
    error instanceof NfcError.TagNotConnected ||
    error instanceof NfcError.Timeout
  ) {
    return new NfcTagError(
      "tag-lost",
      "The tag moved away before the operation finished. Hold it still and try again.",
    );
  }

  const message = messageOf(error);
  if (/cancel/i.test(message)) {
    return new NfcTagError("cancelled", "Operation cancelled.");
  }
  if (/not.?enabled|disabled|turned off/i.test(message)) {
    return new NfcTagError(
      "disabled",
      "NFC is turned off. Enable it in your device settings.",
    );
  }
  if (/not.?supported|unsupported/i.test(message)) {
    return new NfcTagError(
      "unsupported",
      "This device doesn't support NFC tag writing.",
    );
  }
  if (/size|space|capacity|too.?long/i.test(message)) {
    return new NfcTagError(
      "too-small",
      "This tag doesn't have enough space for the link.",
    );
  }

  return new NfcTagError(
    "unknown",
    operation === "lock"
      ? "Couldn't lock the tag. Hold it still and try again."
      : "Couldn't write to the tag. Hold it still and try again.",
  );
}

export class NfcService {
  private startPromise: Promise<void> | null = null;
  private busy = false;
  private cancelRequested = false;

  get isBusy(): boolean {
    return this.busy;
  }

  private async ensureStarted(): Promise<void> {
    if (!this.startPromise) {
      this.startPromise = NfcManager.start().catch((error) => {
        this.startPromise = null;
        throw error;
      });
    }
    await this.startPromise;
  }

  async isSupported(): Promise<boolean> {
    await this.ensureStarted();
    return Boolean(await NfcManager.isSupported());
  }

  async isEnabled(): Promise<boolean> {
    await this.ensureStarted();
    return Boolean(await NfcManager.isEnabled());
  }

  async openSettings(): Promise<void> {
    if (Platform.OS === "android") {
      await NfcManager.goToNfcSetting();
    }
  }

  async cancelPendingOperation(): Promise<void> {
    this.cancelRequested = true;
    try {
      await NfcManager.cancelTechnologyRequest({ throwOnError: false });
    } catch {
      // No active session, or the platform already ended it.
    }
  }

  async writeUriToTag(
    uri: string,
    options: NfcTagOptions = {},
  ): Promise<NfcWriteResult> {
    try {
      return await this.withTagSession(options, async (tag) => {
        const bytes = Ndef.encodeMessage([Ndef.uriRecord(uri)]);

        if (tag.isWritable === false) {
          throw new NfcTagError("not-writable", "This NFC tag is read-only.");
        }
        if (tag.maxSize !== undefined && bytes.length > tag.maxSize) {
          throw new NfcTagError(
            "too-small",
            `This tag is too small for the link (${bytes.length} bytes needed, ${tag.maxSize} available).`,
          );
        }

        await NfcManager.ndefHandler.writeNdefMessage(bytes);

        return {
          uri,
          encodedSize: bytes.length,
          maxSize: tag.maxSize,
          tagId: tag.id,
        };
      });
    } catch (error) {
      throw this.toOperationError(error, "write");
    }
  }

  /**
   * Permanently makes an NDEF tag read-only. This cannot be undone once the
   * tag has been locked.
   */
  async lockTag(options: NfcTagOptions = {}): Promise<NfcLockResult> {
    try {
      return await this.withTagSession(options, async (tag) => {
        if (tag.isWritable === false) {
          throw new NfcTagError(
            "not-writable",
            "This NFC tag is already read-only.",
          );
        }

        await NfcManager.ndefHandler.makeReadOnly();

        return { tagId: tag.id };
      });
    } catch (error) {
      throw this.toOperationError(error, "lock");
    }
  }

  private toOperationError(
    error: unknown,
    operation: NfcTagOperation,
  ): NfcTagError {
    if (error instanceof NfcTagError) return error;
    if (this.cancelRequested) {
      return new NfcTagError("cancelled", "Operation cancelled.");
    }
    return toNfcTagError(error, operation);
  }

  private async withTagSession<T>(
    options: NfcTagOptions,
    action: (tag: TagEvent) => Promise<T>,
  ): Promise<T> {
    if (this.busy) {
      throw new NfcTagError(
        "busy",
        "Another NFC operation is already in progress.",
      );
    }

    this.busy = true;
    this.cancelRequested = false;
    let requestAttempted = false;

    const throwIfCancelled = () => {
      if (this.cancelRequested) {
        throw new NfcTagError("cancelled", "Operation cancelled.");
      }
    };

    try {
      await this.ensureStarted();
      throwIfCancelled();

      const supported = await NfcManager.isSupported();
      if (!supported) {
        throw new NfcTagError(
          "unsupported",
          "This device doesn't support NFC tag writing.",
        );
      }
      throwIfCancelled();

      const enabled = await NfcManager.isEnabled();
      if (!enabled) {
        throw new NfcTagError(
          "disabled",
          "NFC is turned off. Enable it in your device settings.",
        );
      }
      throwIfCancelled();

      requestAttempted = true;
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: options.alertMessage || DEFAULT_ALERT_MESSAGE,
      });
      throwIfCancelled();

      const tag: TagEvent | null = await NfcManager.getTag();
      if (!tag) {
        throw new NfcTagError(
          "tag-lost",
          "No tag was detected. Hold your phone against the tag and try again.",
        );
      }

      return await action(tag);
    } finally {
      this.busy = false;
      if (requestAttempted) {
        try {
          await NfcManager.cancelTechnologyRequest({ throwOnError: false });
        } catch {
          // The session may already be closed by the tag or the OS.
        }
      }
    }
  }
}

export const nfcService = new NfcService();
