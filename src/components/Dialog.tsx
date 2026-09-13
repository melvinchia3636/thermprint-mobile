import { type StyleProp, type ViewStyle } from "react-native";
import { Dialog as PaperDialog, Portal, Button, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "./Text";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function Dialog({
  visible,
  onDismiss,
  title,
  subtitle,
  icon,
  iconColor,
  children,
  primaryAction,
  secondaryAction,
  actions,
  dismissable = true,
  style,
}: {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  icon?: MaterialIconName;
  iconColor?: string;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    mode?: "text" | "outlined" | "contained" | "elevated" | "contained-tonal";
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    textColor?: string;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    mode?: "text" | "outlined" | "contained" | "elevated" | "contained-tonal";
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    textColor?: string;
  };
  actions?: React.ReactNode;
  dismissable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <Portal>
      <PaperDialog
        visible={visible}
        onDismiss={onDismiss}
        dismissable={dismissable}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
          },
          style,
        ]}
      >
        {icon && (
          <PaperDialog.Icon
            icon={() => (
              <MaterialIcons
                name={icon}
                size={32}
                color={iconColor || theme.colors.primary}
              />
            )}
          />
        )}

        {title && (
          <PaperDialog.Title
            style={{
              fontWeight: "700",
              color: theme.colors.onSurface,
              textAlign: icon ? "center" : "left",
              fontSize: 20,
              marginBottom: subtitle ? 4 : 8,
            }}
          >
            {title}
          </PaperDialog.Title>
        )}

        {(subtitle || children) && (
          <PaperDialog.Content>
            {subtitle && (
              <Text
                variant="bodyMedium"
                className={`text-zinc-400 ${icon ? "text-center" : "text-left"} ${children ? "mb-4" : "mb-0"}`}
              >
                {subtitle}
              </Text>
            )}
            {children}
          </PaperDialog.Content>
        )}

        {actions ? (
          <PaperDialog.Actions>{actions}</PaperDialog.Actions>
        ) : primaryAction || secondaryAction ? (
          <PaperDialog.Actions
            style={{
              flexDirection: "column",
              alignItems: "stretch",
              gap: 8,
              paddingHorizontal: 24,
              paddingBottom: 16,
            }}
          >
            {primaryAction && (
              <Button
                mode={primaryAction.mode || "contained"}
                icon={primaryAction.icon}
                onPress={primaryAction.onPress}
                loading={primaryAction.loading}
                disabled={primaryAction.disabled}
                textColor={primaryAction.textColor}
                contentStyle={{ paddingVertical: 4 }}
              >
                {primaryAction.label}
              </Button>
            )}

            {secondaryAction && (
              <Button
                mode={secondaryAction.mode || "outlined"}
                icon={secondaryAction.icon}
                onPress={secondaryAction.onPress}
                loading={secondaryAction.loading}
                disabled={secondaryAction.disabled}
                textColor={secondaryAction.textColor}
                contentStyle={{ paddingVertical: 4 }}
              >
                {secondaryAction.label}
              </Button>
            )}
          </PaperDialog.Actions>
        ) : null}
      </PaperDialog>
    </Portal>
  );
}

export const Modal = Dialog;
