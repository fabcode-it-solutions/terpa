import { useColors } from "@/theme";
import { StyleSheet, View } from "react-native";
import { ThemeText } from "./primitives";
import VisaIcon from "@/assets/images/visa.svg";
import MastercardIcon from "@/assets/images/mastercard.svg";
import AmexIcon from "@/assets/images/amex.svg";
import DiscoverIcon from "@/assets/images/discover.svg";

// Payment Transaction Item Component
interface PaymentTransactionProps {
  type?: string | null;
  method?: string | null;
  cardNumber?: string;
  amount?: string;
  status?: string;
  statusColor?: string;
  bank?: string | null;
  timestamp?: string;
  approved?: boolean;
  reversed?: boolean;
}

export const PaymentTransaction: React.FC<PaymentTransactionProps> = ({
  type,
  method,
  cardNumber,
  amount,
  status,
  statusColor = "success",
  bank,
  timestamp,
  approved,
  reversed,
}) => {
  const colors = useColors();

  // Apply opacity to non-approved transactions (matching web app behavior)
  const shouldApplyOpacity = approved === false || reversed === true;

  // Get card brand SVG component based on type
  const getCardBrandComponent = (brand?: string | null) => {
    const normalized = brand?.toUpperCase() ?? "";
    if (normalized.includes("VISA")) return VisaIcon;
    if (normalized.includes("MASTER")) return MastercardIcon;
    if (normalized.includes("AMEX") || normalized.includes("AMERICAN")) return AmexIcon;
    if (normalized.includes("DISCOVER")) return DiscoverIcon;
    return VisaIcon; // default fallback
  };

  // Map status color to theme colors
  const statusColorMap = {
    success: colors.success.main,
    error: colors.error.main,
    warning: colors.warning?.main ?? "#FFA500",
  };

  const finalStatusColor =
    statusColorMap[statusColor as keyof typeof statusColorMap] ?? colors.success.main;
  const CardIcon = getCardBrandComponent(type);

  return (
    <View
      style={[
        styles.paymentItem,
        { opacity: shouldApplyOpacity ? 0.5 : 1.0, borderBottomColor: colors.border },
      ]}
    >
      {/* Main container with card icon and content */}
      <View style={styles.mainContainer}>
        {/* Card Icon */}
        <View style={styles.cardIconContainer}>
          <CardIcon width={35} height={24} />
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Line 1: Method/Card Number and Amount */}
          <View style={styles.row1}>
            <ThemeText variant="subtitle4" fontWeight={600} style={styles.methodText}>
              {method} {cardNumber ? `...${cardNumber}` : ""}
            </ThemeText>
            <ThemeText variant="subtitle4" fontWeight={600}>
              {amount ?? "$0.00"}
            </ThemeText>
          </View>

          {/* Line 2: Bank */}
          {bank && (
            <ThemeText variant="caption2" color={colors.text.secondary}>
              {bank}
            </ThemeText>
          )}

          {/* Line 3: Status and Timestamp */}
          <View style={styles.row3}>
            <ThemeText variant="caption2" style={{ color: finalStatusColor }}>
              {status ?? "Aprobada"}
            </ThemeText>
            {timestamp && (
              <>
                <ThemeText variant="caption2" color={colors.text.secondary}>
                  •
                </ThemeText>
                <ThemeText variant="caption2" color={colors.text.secondary}>
                  {timestamp}
                </ThemeText>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mainContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cardIconContainer: {
    width: 35,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contentColumn: {
    flex: 1,
    gap: 4,
  },
  row1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodText: {
    flex: 1,
    flexShrink: 1,
  },
});
