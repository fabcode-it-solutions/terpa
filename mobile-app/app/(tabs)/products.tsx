import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { FlatListProps } from "react-native";
import { useTheme, useColors } from "@/theme/hooks";
import { ThemeText } from "@/components";
import { Header } from "@/components/shared/header/header";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDebounce, useBottomContentPadding } from "@/utils/hooks";
import SeachBar from "@/components/shared/search-bar/search-bar";
import { ProductsList, type ProductRow } from "@/features/products/components/ProductsList";
import { useTeamStore } from "@/stores/teamStore";
import { DEFAULT_TEAM_ID } from "@/utils/config";
import { useProducts } from "@/hooks/queries/products";
import ProductsSkeleton from "@/components/shared/skeletons/ProductsSkeleton";
import { useProductsVM } from "@/features/products/hooks/useProductsVM";
import { useTranslation } from "react-i18next";

type SectionItem = {
  key: string;
  element: React.ReactElement;
};

const ProductsScreen: React.FC = () => {
  const theme = useTheme();
  const colors = useColors();
  const bottomPad = useBottomContentPadding(100);
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const teamId = selectedTeamId ?? DEFAULT_TEAM_ID;
  const {
    data: products,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useProducts(teamId, { query: debouncedSearchText?.trim() || undefined });
  const tableData = useProductsVM(products);

  const handleItemPress = (_item: ProductRow) => {};

  const listEmptyComponent = useMemo(() => {
    if (!error) return undefined;

    const ErrorView = React.memo(() => (
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          borderRadius: 8,
          backgroundColor: theme.colors.error.light,
        }}
      >
        <ThemeText variant="body2">{t("products.error")}</ThemeText>
      </View>
    ));

    ErrorView.displayName = "ErrorView";

    return ErrorView;
  }, [colors.border, error, t, theme.colors.error.light]);

  // Props for nested ProductsList - scrolling disabled since main FlatList handles it
  const listProps = useMemo<Partial<FlatListProps<ProductRow>>>(() => {
    const base: Partial<FlatListProps<ProductRow>> = {
      scrollEnabled: false,
    };
    if (listEmptyComponent) {
      base.ListEmptyComponent = listEmptyComponent;
    }
    return base;
  }, [listEmptyComponent]);

  const productsListContent = useMemo(() => {
    if (isLoading) {
      return <ProductsSkeleton />;
    }
    return <ProductsList data={tableData} onItemPress={handleItemPress} listProps={listProps} />;
  }, [isLoading, tableData, listProps]);

  const sections = useMemo<SectionItem[]>(
    () => [
      {
        key: "search",
        element: (
          <View style={styles.section}>
            <SeachBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("products.searchPlaceholder")}
            />
          </View>
        ),
      },
      {
        key: "productsList",
        element: <View style={styles.section}>{productsListContent}</View>,
      },
    ],
    [searchText, setSearchText, t, productsListContent],
  );

  const renderSection = useCallback(
    ({ item }: { item: SectionItem }): React.ReactElement => item.element,
    [],
  );
  const keyExtractor = useCallback((item: SectionItem) => item.key, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.default }]}
      edges={["top"]}
    >
      <Header teamId={selectedTeamId} />

      <View style={styles.titleContainer}>
        <ThemeText variant="h3">{t("navigation.tabs.products")}</ThemeText>
      </View>

      <FlatList
        style={styles.content}
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshing={Boolean(isRefetching)}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
});
