import { useCallback, useEffect, useState } from "react";
import { AppState, Platform, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  HelperText,
  TextInput,
  useTheme,
} from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import { SectionCard } from "@/components/SectionCard";
import { toastService } from "@/lib/core";
import {
  getNfcLinkError,
  nfcService,
  normalizeNfcLink,
  NfcTagError,
} from "@/lib/services";

type NfcAvailability = "checking" | "ready" | "unsupported" | "disabled";

type WritePhase =
  | { type: "idle" }
  | { type: "scanning" }
  | {
      type: "success";
      url: string;
      encodedSize: number;
      maxSize?: number;
    }
  | { type: "error"; message: string };

type LockPhase =
  | { type: "idle" }
  | { type: "waiting" }
  | { type: "success"; tagId?: string }
  | { type: "error"; message: string };

export function NfcTagTab() {
  const theme = useTheme();
  const [link, setLink] = useState("");
  const [availability, setAvailability] =
    useState<NfcAvailability>("checking");
  const [phase, setPhase] = useState<WritePhase>({ type: "idle" });
  const [lockPhase, setLockPhase] = useState<LockPhase>({ type: "idle" });

  const refreshAvailability = useCallback(async () => {
    try {
      const supported = await nfcService.isSupported();
      if (!supported) {
        setAvailability("unsupported");
        return;
      }
      const enabled = await nfcService.isEnabled();
      setAvailability(enabled ? "ready" : "disabled");
    } catch {
      setAvailability("unsupported");
    }
  }, []);

  useEffect(() => {
    refreshAvailability();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshAvailability();
      }
    });

    return () => {
      subscription.remove();
      nfcService.cancelPendingOperation().catch(() => {
        // No active NFC session.
      });
    };
  }, [refreshAvailability]);

  const linkError = getNfcLinkError(link);
  const isScanning = phase.type === "scanning";
  const isLocking = lockPhase.type === "waiting";
  const canWrite =
    availability === "ready" && !linkError && !isScanning && !isLocking;

  function handleLinkChange(value: string) {
    setLink(value);
    if (phase.type === "success" || phase.type === "error") {
      setPhase({ type: "idle" });
    }
  }

  async function handleWrite() {
    if (getNfcLinkError(link)) return;

    const url = normalizeNfcLink(link);
    setPhase({ type: "scanning" });

    try {
      const result = await nfcService.writeUriToTag(url, {
        alertMessage: "Hold your phone near the NFC tag",
      });
      setPhase({
        type: "success",
        url: result.uri,
        encodedSize: result.encodedSize,
        maxSize: result.maxSize,
      });
      toastService.show("Link written to NFC tag");
    } catch (error) {
      if (error instanceof NfcTagError && error.code === "cancelled") {
        setPhase({ type: "idle" });
        toastService.show("Write cancelled");
        return;
      }

      setPhase({
        type: "error",
        message:
          error instanceof NfcTagError
            ? error.message
            : "Couldn't write to the tag. Hold it still and try again.",
      });
    } finally {
      refreshAvailability();
    }
  }

  async function handleLock() {
    setLockPhase({ type: "waiting" });

    try {
      const result = await nfcService.lockTag({
        alertMessage: "Hold your phone near the NFC tag to lock it",
      });
      setLockPhase({ type: "success", tagId: result.tagId });
      toastService.show("NFC tag locked");
    } catch (error) {
      if (error instanceof NfcTagError && error.code === "cancelled") {
        setLockPhase({ type: "idle" });
        toastService.show("Lock cancelled");
        return;
      }

      setLockPhase({
        type: "error",
        message:
          error instanceof NfcTagError
            ? error.message
            : "Couldn't lock the tag. Hold it still and try again.",
      });
    } finally {
      refreshAvailability();
    }
  }

  async function handleCancel() {
    await nfcService.cancelPendingOperation();
  }

  async function handleOpenSettings() {
    try {
      await nfcService.openSettings();
    } catch {
      toastService.show("Open your device settings and turn on NFC");
    }
  }

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      <SectionCard
        title="NFC Link"
        subtitle="Write a web link to an NFC tag"
      >
        <TextInput
          mode="outlined"
          label="Destination URL"
          placeholder="https://example.com"
          value={link}
          onChangeText={handleLinkChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          disabled={isScanning}
          error={Boolean(linkError && link.length > 0)}
          left={<TextInput.Icon icon="link" />}
          right={
            link && !isScanning ? (
              <TextInput.Icon
                icon="close"
                onPress={() => handleLinkChange("")}
              />
            ) : undefined
          }
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        />

        {link.length > 0 && linkError ? (
          <HelperText type="error" visible>
            {linkError}
          </HelperText>
        ) : (
          <Text variant="bodySmall" className="text-zinc-400 mt-2">
            If you leave out the scheme, https:// is added automatically.
          </Text>
        )}

        {link.length > 0 && !linkError ? (
          <View className="flex-row items-center gap-2 bg-zinc-800 rounded-xl p-3 mt-3">
            <MaterialIcons
              name="link"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              className="text-zinc-300 flex-1"
              numberOfLines={2}
            >
              {normalizeNfcLink(link)}
            </Text>
          </View>
        ) : null}
      </SectionCard>

      {availability === "unsupported" ? (
        <SectionCard title="NFC Unavailable">
          <View className="flex-row items-start gap-3">
            <MaterialIcons
              name="error-outline"
              size={22}
              color={theme.colors.error}
            />
            <Text variant="bodyMedium" className="text-zinc-400 flex-1">
              This device doesn't support NFC tag writing. Use a physical
              device that supports NFC.
            </Text>
          </View>
        </SectionCard>
      ) : null}

      {availability === "disabled" ? (
        <SectionCard title="NFC Is Turned Off">
          <View className="flex-row items-start gap-3">
            <MaterialIcons
              name="nfc"
              size={22}
              color={theme.colors.error}
            />
            <Text variant="bodyMedium" className="text-zinc-400 flex-1">
              Turn on NFC in your device settings to write to a tag.
            </Text>
          </View>
          {Platform.OS === "android" ? (
            <Button
              mode="outlined"
              icon="cog-outline"
              onPress={handleOpenSettings}
              style={{ marginTop: 12 }}
            >
              Open NFC Settings
            </Button>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Write to NFC Tag"
        headerExtra={
          <View className="flex-row items-center gap-1.5">
            <MaterialIcons
              name="nfc"
              size={16}
              color={
                availability === "ready"
                  ? "#4ADE80"
                  : theme.colors.onSurfaceVariant
              }
            />
            <Text
              variant="labelSmall"
              className={
                availability === "ready"
                  ? "text-emerald-400"
                  : "text-zinc-400"
              }
            >
              {availability === "ready"
                ? "NFC Ready"
                : availability === "checking"
                  ? "Checking..."
                  : "Unavailable"}
            </Text>
          </View>
        }
      >
        {phase.type === "idle" ? (
          <Text variant="bodyMedium" className="text-zinc-400">
            Tap Write, then hold the top of your phone against the NFC tag
            until the write completes. Keep the tag still during the write.
          </Text>
        ) : null}

        {phase.type === "scanning" ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleSmall" weight="bold" className="mt-3">
              Waiting for NFC tag
            </Text>
            <Text
              variant="bodySmall"
              className="text-zinc-400 mt-1 text-center"
            >
              Hold the top of your phone against the tag until the write
              completes.
            </Text>
          </View>
        ) : null}

        {phase.type === "success" ? (
          <View className="flex-row items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <MaterialIcons name="check-circle" size={22} color="#4ADE80" />
            <View className="flex-1">
              <Text variant="titleSmall" weight="bold">
                Link written
              </Text>
              <Text
                variant="bodySmall"
                className="text-zinc-400 mt-0.5"
                numberOfLines={2}
              >
                {phase.url}
              </Text>
              {phase.maxSize !== undefined ? (
                <Text variant="labelSmall" className="text-zinc-500 mt-1">
                  {phase.encodedSize} of {phase.maxSize} bytes used
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {phase.type === "error" ? (
          <View className="flex-row items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <MaterialIcons name="error-outline" size={22} color="#F87171" />
            <Text variant="bodyMedium" className="text-red-300 flex-1">
              {phase.message}
            </Text>
          </View>
        ) : null}

        <Button
          mode="contained"
          icon="nfc"
          onPress={handleWrite}
          loading={isScanning}
          disabled={!canWrite}
          contentStyle={{ paddingVertical: 6 }}
          style={{ marginTop: 16 }}
        >
          {phase.type === "success" ? "Write Another Tag" : "Write to NFC Tag"}
        </Button>

        {isScanning ? (
          <Button
            mode="text"
            onPress={handleCancel}
            style={{ marginTop: 4 }}
          >
            Cancel
          </Button>
        ) : null}

        <View className="flex-row items-start gap-2 mt-3">
          <MaterialIcons
            name="info-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" className="text-zinc-400 flex-1">
            The tag must be NDEF-compatible and writable. The link is stored
            as a standard NDEF URI record.
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Lock NFC Tag"
        headerExtra={
          <MaterialIcons
            name="lock"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        }
      >
        <View className="flex-row items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <MaterialIcons name="warning" size={22} color="#FBBF24" />
          <Text variant="bodyMedium" className="text-amber-200 flex-1">
            Locking makes the tag permanently read-only. You won't be able to
            write new links to it, and this cannot be undone.
          </Text>
        </View>

        {lockPhase.type === "waiting" ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleSmall" weight="bold" className="mt-3">
              Waiting for NFC tag
            </Text>
            <Text
              variant="bodySmall"
              className="text-zinc-400 mt-1 text-center"
            >
              Hold the top of your phone against the tag until locking
              completes.
            </Text>
          </View>
        ) : null}

        {lockPhase.type === "success" ? (
          <View className="flex-row items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mt-3">
            <MaterialIcons name="lock" size={22} color="#4ADE80" />
            <View className="flex-1">
              <Text variant="titleSmall" weight="bold">
                Tag locked
              </Text>
              <Text
                variant="bodySmall"
                className="text-zinc-400 mt-0.5"
              >
                The tag is now permanently read-only.
              </Text>
            </View>
          </View>
        ) : null}

        {lockPhase.type === "error" ? (
          <View className="flex-row items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-3">
            <MaterialIcons name="error-outline" size={22} color="#F87171" />
            <Text variant="bodyMedium" className="text-red-300 flex-1">
              {lockPhase.message}
            </Text>
          </View>
        ) : null}

        <Button
          mode="outlined"
          icon="lock"
          onPress={handleLock}
          loading={isLocking}
          disabled={availability !== "ready" || isScanning || isLocking}
          textColor={theme.colors.error}
          style={{ marginTop: 16, borderColor: theme.colors.error }}
        >
          {lockPhase.type === "success"
            ? "Lock Another Tag"
            : "Lock Tag Permanently"}
        </Button>

        {isLocking ? (
          <Button
            mode="text"
            onPress={handleCancel}
            style={{ marginTop: 4 }}
          >
            Cancel
          </Button>
        ) : null}
      </SectionCard>
    </ScrollView>
  );
}
