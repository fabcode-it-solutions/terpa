import React from "react";
import { UsersProductsTable } from "@/components/shared/tables/users-products-table";
import type { TableData } from "@/components/shared/tables/users-products-table";
import type { FlatListProps } from "react-native";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  priceFormatted?: string;
  image?: string;
  type: "product";
};

export const ProductsList: React.FC<{
  data: ProductRow[];
  onItemPress?: (row: ProductRow) => void;
  listProps?: Partial<FlatListProps<ProductRow>>;
}> = ({ data, onItemPress, listProps }) => {
  return (
    <UsersProductsTable
      data={data}
      dataType="products"
      onItemPress={onItemPress as any}
      listProps={listProps as Partial<FlatListProps<TableData>>}
    />
  );
};
