import { Dialog } from "./Dialog";

export function PrintSuccessModal({
  visible,
  onDismiss,
  onPrintAgain,
  title = "Printed Successfully",
  message = "Would you like to print another image?",
  printAgainLabel = "Print Another Image",
  doneLabel = "Done",
}: {
  visible: boolean;
  onDismiss: () => void;
  onPrintAgain?: () => void;
  title?: string;
  message?: string;
  printAgainLabel?: string;
  doneLabel?: string;
}) {
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      icon="check-circle"
      title={title}
      subtitle={message}
      primaryAction={
        onPrintAgain
          ? {
              label: printAgainLabel,
              icon: "printer",
              onPress: onPrintAgain,
            }
          : undefined
      }
      secondaryAction={{
        label: doneLabel,
        onPress: onDismiss,
      }}
    />
  );
}
