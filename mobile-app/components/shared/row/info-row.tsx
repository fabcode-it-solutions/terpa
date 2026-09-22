import { ThemeText } from "@/components/primitives";
import { useColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, TouchableOpacity, View, type ImageSourcePropType } from "react-native";

interface InfoRowProps {
  icon: ImageSourcePropType;
  isLinkValue?: string;
  label: string;
  value: string;
  isLink?: boolean;
  hasMore?: boolean;
  isLast?: boolean;
}

export const InfoRow = ({
  icon,
  isLinkValue,
  label,
  value,
  isLink = false,
  hasMore = false,
  isLast = false,
}: InfoRowProps) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.infoLeft}>
        <Image
          source={icon}
          style={{
            width: 20,
            height: 20,
            resizeMode: "contain",
            opacity: 0.6,
          }}
        />
        <ThemeText variant="body2" color={colors.text.primary}>
          {value}
        </ThemeText>
      </View>

      <View style={styles.infoRight}>
        {isLink && isLinkValue && (
          <TouchableOpacity>
            <ThemeText variant="body2" color={colors.info.main}>
              {isLinkValue}
            </ThemeText>
          </TouchableOpacity>
        )}

        <ThemeText variant="body2" color={colors.text.secondary}>
          {label}
        </ThemeText>

        {hasMore && (
          <TouchableOpacity style={styles.moreIcon}>
            <Ionicons name="ellipsis-vertical" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreIcon: {
    padding: 4,
  },
});
