import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@/components/Text";
import { ModeCard } from "./components/ModeCard";
import type { FeatureTab, RootStackParamList } from "@/lib/core";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

const MODES: {
  id: FeatureTab;
  title: string;
  description: string;
  icon: MaterialIconName;
}[] = [
  {
    id: "image",
    title: "Image",
    description: "Upload & dither photos",
    icon: "image",
  },
  {
    id: "qrcode",
    title: "QR Code",
    description: "Custom styles & logos",
    icon: "qr-code",
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Receipt calendars",
    icon: "calendar-month",
  },
  {
    id: "spine_tag",
    title: "Spine Tag",
    description: "Journal DataMatrix tags",
    icon: "label",
  },
  {
    id: "youtube",
    title: "YouTube",
    description: "Thumbnails with QR link",
    icon: "smart-display",
  },
];

export function HomeScreen({
  onSelectMode,
}: {
  onSelectMode?: (mode: FeatureTab) => void;
}) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Home">>();

  // Chunk into pairs of 2 for 2-by-X grid layout
  const rows: {
    id: FeatureTab;
    title: string;
    description: string;
    icon: MaterialIconName;
  }[][] = [];
  for (let i = 0; i < MODES.length; i += 2) {
    rows.push(MODES.slice(i, i + 2));
  }

  return (
    <ScrollView contentContainerClassName="p-4">
      <View className="mb-4">
        <Text variant="titleLarge" weight="bold">
          Select Print Mode
        </Text>
        <Text
          variant="bodyMedium"
          className="text-zinc-400 mt-0.5"
        >
          Choose a template to preview and print
        </Text>
      </View>

      <View className="gap-3">
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row gap-3 items-stretch"
          >
            {row.map((item) => (
              <ModeCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onPress={(id) =>
                  onSelectMode ? onSelectMode(id) : navigation.navigate(id)
                }
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
