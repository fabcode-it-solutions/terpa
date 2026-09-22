import { ThemeText } from "@/components/primitives";
import { useColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface AmountCardProps {
  title: string;
  amount: string | number;
  onPress?: () => void;
  showArrow?: boolean;
}

export const AmountCard = ({ title, amount, onPress, showArrow = true }: AmountCardProps) => {
  const colors = useColors();

  const content = (
    <>
      <View style={styles.amountCardContent}>
        <ThemeText variant="h6" color={colors.text.primary}>
          {title}
        </ThemeText>
        {showArrow && onPress && (
          <Ionicons
            style={{
              marginRight: -8,
            }}
            name="chevron-forward"
            size={22}
            color={colors.text.secondary}
          />
        )}
      </View>
      <ThemeText variant="subtitle3" color={colors.text.secondary}>
        {amount}
      </ThemeText>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.amountCard,
          { borderColor: colors.border, backgroundColor: colors.background.paper },
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.amountCard,
        { borderColor: colors.border, backgroundColor: colors.background.paper },
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  amountCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  amountCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
});
