import { ThemeText } from "@/components/primitives";
import { useColors, useDarkMode } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import LogoLight from "@/assets/images/logo-light.svg";
import LogoDark from "@/assets/images/logo-dark.svg";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useTeamInfo } from "@/hooks/queries/teamInfo";

type HeaderProps = {
  teamId?: string | null;
};

export const Header = ({ teamId }: HeaderProps) => {
  const colors = useColors();
  const dark = useDarkMode();
  const { data: teamInfo } = useTeamInfo(teamId ?? null);

  const displayTeamName = teamInfo?.name ?? "Mi Cuenta";
  const displayMerchantCode = teamInfo?.pharosMerchantCode;

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logo}>
          {dark ? <LogoDark width={120} height={48} /> : <LogoLight width={120} height={48} />}
        </View>
      </View>
      <TouchableOpacity onPress={() => router.push("/settings")} style={styles.userButton}>
        <View style={styles.userButtonContent}>
          <ThemeText style={styles.accountText} numberOfLines={1} ellipsizeMode="tail">
            {displayTeamName}
          </ThemeText>
          {displayMerchantCode && (
            <ThemeText style={styles.merchantText} numberOfLines={1} ellipsizeMode="tail">
              Comercio: {displayMerchantCode}
            </ThemeText>
          )}
        </View>
        <Ionicons name="person-circle-outline" size={24} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    alignItems: "center",
  },
  logo: {
    // justifyContent: "center",
  },
  userButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  userButtonContent: {
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 1,
  },
  accountText: {
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: 700,
    flexShrink: 1,
  },
  merchantText: {
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: 400,
    opacity: 0.7,
    flexShrink: 1,
    marginTop: -6,
  },
});
