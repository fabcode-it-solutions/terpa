import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { InventoryRow } from "@/features/machine/hooks/useMachineInventoryVM";
import { InventoryQuickAdjustSheet } from "@/components/shared/sheets/InventoryQuickAdjustSheet";
import { InventoryFullEditSheet } from "@/components/shared/sheets/InventoryFullEditSheet";
import { useColors } from "@/theme";

type SheetMode = "quick" | "full" | null;

interface InventoryBottomSheetContextValue {
  openQuickAdjust: (item: InventoryRow) => void;
  openFullEdit: (item: InventoryRow) => void;
  closeSheet: () => void;
  currentItem: InventoryRow | null;
}

const InventoryBottomSheetContext = createContext<InventoryBottomSheetContextValue | undefined>(
  undefined,
);

export const useInventoryBottomSheet = () => {
  const context = useContext(InventoryBottomSheetContext);
  if (!context) {
    throw new Error("useInventoryBottomSheet must be used within InventoryBottomSheetProvider");
  }
  return context;
};

interface InventoryBottomSheetProviderProps {
  children: React.ReactNode;
  teamId: string;
  machineId: string;
  onItemOpen?: () => void;
}

export const InventoryBottomSheetProvider: React.FC<InventoryBottomSheetProviderProps> = ({
  children,
  teamId,
  machineId,
  onItemOpen,
}) => {
  const colors = useColors();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [currentItem, setCurrentItem] = useState<InventoryRow | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  // Snap points: 45% for quick adjust, 80% for full edit
  const snapPoints = ["45%", "80%"];

  const openQuickAdjust = useCallback(
    (item: InventoryRow) => {
      // Trigger refetch callback before opening sheet
      onItemOpen?.();
      setCurrentItem(item);
      setSheetMode("quick");
      bottomSheetRef.current?.snapToIndex(0); // Snap to 35%
    },
    [onItemOpen],
  );

  const openFullEdit = useCallback((item: InventoryRow) => {
    setCurrentItem(item);
    setSheetMode("full");
    bottomSheetRef.current?.snapToIndex(1); // Snap to 80%
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setSheetMode(null);
    setCurrentItem(null);
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // Sheet closed
      setSheetMode(null);
      setCurrentItem(null);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const contextValue = useMemo(
    () => ({
      openQuickAdjust,
      openFullEdit,
      closeSheet,
      currentItem,
    }),
    [openQuickAdjust, openFullEdit, closeSheet, currentItem],
  );

  return (
    <InventoryBottomSheetContext.Provider value={contextValue}>
      {children}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.text.secondary }}
        backgroundStyle={{ backgroundColor: colors.background.paper }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {sheetMode === "quick" && currentItem && (
            <InventoryQuickAdjustSheet
              item={currentItem}
              teamId={teamId}
              machineId={machineId}
              onEditDetails={() => openFullEdit(currentItem)}
              onClose={closeSheet}
            />
          )}
          {sheetMode === "full" && currentItem && (
            <InventoryFullEditSheet
              item={currentItem}
              teamId={teamId}
              machineId={machineId}
              onClose={closeSheet}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </InventoryBottomSheetContext.Provider>
  );
};
