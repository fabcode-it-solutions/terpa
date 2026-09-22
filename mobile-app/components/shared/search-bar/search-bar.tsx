import { ThemeView } from "@/components/primitives";
import { useColors, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { TextInput, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

const SeachBar = ({ value, onChangeText, placeholder, style }: Props = {}) => {
  const colors = useColors();
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const { t } = useTranslation();
  const ph = placeholder ?? t("search.machinesPlaceholder");

  const containerStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.background.paper,
      borderRadius: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    style,
  ];

  return (
    <ThemeView style={containerStyle}>
      <Feather
        name="search"
        size={20}
        color={colors.text.secondary}
        style={{ marginRight: theme.spacing.sm }}
      />
      <TextInput
        style={{
          flex: 1,
          fontSize: 14,
          color: colors.text.primary,
          fontFamily: "Inter-Regular",
          paddingVertical: 0,
          height: 40,
        }}
        placeholder={ph}
        placeholderTextColor={colors.text.secondary}
        value={value ?? searchText}
        onChangeText={(t) => {
          if (onChangeText) onChangeText(t);
          else setSearchText(t);
        }}
      />
    </ThemeView>
  );
};

export default SeachBar;
