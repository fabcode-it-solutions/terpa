import React from "react";
import {
  UsersProductsTable,
  type TableData,
} from "@/components/shared/tables/users-products-table";
import type { FlatListProps } from "react-native";

export type UserRow = { id: string; email: string; role: string; roleColor?: string; type: "user" };

export const UsersList: React.FC<{
  data: UserRow[];
  onItemPress?: (row: UserRow) => void;
  listProps?: Partial<FlatListProps<UserRow>>;
}> = ({ data, onItemPress, listProps }) => {
  return (
    <UsersProductsTable
      data={data}
      dataType="users"
      onItemPress={onItemPress as any}
      listProps={listProps as Partial<FlatListProps<TableData>>}
    />
  );
};
