import { ThemeText, ThemeView } from "@/components";
import { PaymentTransaction } from "@/components/PaymentTransaction";
import { DateNavigator } from "@/components/shared/date-navigator/date-navigator";
import { TerminalCard } from "@/components/shared/card/TerminalCard";
import { useColors } from "@/theme";
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  RefreshControl,
  type FlatListProps,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useMachineTerminal } from "@/hooks/queries/vending";
import { useBottomContentPadding, useDateNavigator } from "@/utils/hooks";
import { useMachineTerminalVM } from "@/features/machine/hooks/useMachineTerminalVM";
import { TerminalSkeleton } from "@/components/shared/skeletons/TerminalSkeleton";

type TerminalScreenProps = {
  teamId: string;
  machineId: string;
  listProps?: Partial<FlatListProps<any>>;
};

export const TerminalScreen: React.FC<TerminalScreenProps> = ({ teamId, machineId, listProps }) => {
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const bottomPad = useBottomContentPadding(10);

  const { selectedDate, setSelectedDate, isoDate, shortFormattedDate, prev, next } =
    useDateNavigator(undefined, i18n.language);
  const { data, isLoading, isRefetching, refetch } = useMachineTerminal(teamId, machineId, isoDate);

  const { paymentData } = useMachineTerminalVM({ data });

  // Track manual refresh separately from automatic refetches
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const previousDateRef = useRef(isoDate);

  const handleRefresh = () => {
    setIsManualRefreshing(true);
    void refetch();
  };

  // Reset manual refresh state when refetch completes
  useEffect(() => {
    if (!isRefetching && isManualRefreshing) {
      setIsManualRefreshing(false);
    }
  }, [isRefetching, isManualRefreshing]);

  // Track date changes
  useEffect(() => {
    previousDateRef.current = isoDate;
  }, [isoDate]);

  const TerminalCardComponent = useMemo(
    () => (
      <TerminalCard
        totalApproved={{
          label: "Transacciones Aprobadas",
          value: data?.summary?.totalApproved?.valueCents,
          formatted: data?.summary?.totalApproved?.valueFormatted,
        }}
      />
    ),
    [data?.summary?.totalApproved?.valueCents, data?.summary?.totalApproved?.valueFormatted],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) =>
      `${item?.transactionId ?? item?.timestamp ?? item?.cardNumber ?? index}`,
    [],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <ThemeView
        rounded="md"
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <View style={styles.emptyState}>
          <ThemeText variant="body2" color={colors.text.secondary}>
            {t("terminal.empty")}
          </ThemeText>
        </View>
      </ThemeView>
    ),
    [colors, t],
  );

  const {
    contentContainerStyle: externalContentContainerStyle,
    style: externalListStyle,
    ...restListProps
  } = listProps ?? {};

  const ListComponent =
    paymentData.length === 0 ? (
      ListEmptyComponent
    ) : (
      <View
        style={[
          styles.transactionsContainer,
          {
            backgroundColor: colors.background.paper,
            borderColor: colors.border,
          },
        ]}
      >
        {paymentData.map((item, index) => (
          <View key={keyExtractor(item, index)}>
            <PaymentTransaction
              type={item.type}
              method={item.method}
              cardNumber={item.cardNumber}
              amount={item.amount}
              status={item.status}
              statusColor={item.statusColor}
              bank={item.bank}
              timestamp={item.timestamp}
              approved={item.approved}
              reversed={item.reversed}
            />
          </View>
        ))}
      </View>
    );

  return (
    <FlatList
      style={[styles.container, externalListStyle]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          marginBottom: Platform.OS === "ios" ? bottomPad : 0,
        },
        externalContentContainerStyle,
      ]}
      data={[null] as any[]}
      keyExtractor={() => "terminal-content"}
      renderItem={() => (
        <View>
          {/* Date Navigator - always visible */}
          <DateNavigator
            date={shortFormattedDate}
            value={selectedDate}
            onPrevious={prev}
            onNext={next}
            onDateChange={(date) => setSelectedDate(date)}
          />

          {/* Access Denied Notice */}
          {data?.accessDenied && (
            <ThemeView
              style={[
                styles.noticeBox,
                {
                  backgroundColor: "#FEE",
                  borderColor: colors.error.main,
                },
              ]}
            >
              <ThemeText
                variant="subtitle4"
                style={{ color: colors.error.main, textAlign: "center" }}
              >
                🔒 {data.accessDeniedReason || "Acceso Restringido"}
              </ThemeText>
              <ThemeText
                variant="caption1"
                style={{ color: colors.text.secondary, textAlign: "center", marginTop: 8 }}
              >
                No tienes permisos para ver información financiera de esta máquina.
              </ThemeText>
            </ThemeView>
          )}

          {/* Machine Locked/Inactive Notice */}
          {data?.machineStatus?.isLocked && !data?.accessDenied && (
            <ThemeView
              style={[
                styles.noticeBox,
                {
                  backgroundColor: "#FFF8E1",
                  borderColor: "#FFA500",
                },
              ]}
            >
              <ThemeText variant="subtitle4" style={{ color: "#FFA500", textAlign: "center" }}>
                ⚠️ Máquina Inactiva
              </ThemeText>
              <ThemeText
                variant="caption1"
                style={{ color: colors.text.secondary, textAlign: "center", marginTop: 8 }}
              >
                {data.machineStatus.lockedMessage || "Esta máquina está fuera de servicio."}
              </ThemeText>
            </ThemeView>
          )}

          {/* Show skeleton while loading or during date changes (but not manual refresh) */}
          {isLoading || (isRefetching && !isManualRefreshing) ? (
            <TerminalSkeleton />
          ) : (
            <View>
              {TerminalCardComponent}
              {ListComponent}
            </View>
          )}
        </View>
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} />}
      {...restListProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  noticeBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionsContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
});
