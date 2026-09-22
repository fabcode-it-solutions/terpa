# Inventory Management in Terpa Web

This document covers the inventory management features of the Terpa Web application, including product management and stock control within machines.

## 1. Overview

Inventory management is crucial for tracking products, their stock levels in various locations (likely machines), and managing replenishment operations. This system ensures that products are available where needed and that stock data is accurate.

## 2. Key Components and Files

- **Product Management Components (`components/product/`)**:
  - `product-create-card.tsx`: UI for adding new products to the system.
  - `product-edit-card.tsx`: UI for modifying existing product details.
  - `product-form.tsx`: The core form used for creating and editing products.
  - `product-delete-dialog.tsx`: Confirmation dialog for deleting a product.
  - `product-dropdown.tsx`: Context menu or dropdown for product-specific actions.
- **Inventory Control Components (`components/inventory/`)**:
  - **Spirals (Machine Slots/Channels)**:
    - `spiral-create-dialog.tsx` & `spiral-form.tsx`: For defining new spirals/slots within a machine and associating products.
    - `spiral-edit-dialog.tsx`: For modifying spiral configurations.
    - `spiral-delete-dialog.tsx`: For removing a spiral configuration.
    - `spiral-dropdown.tsx`: Context menu for spiral actions.
    - `spiral-fill-dialog.tsx`: UI for recording the filling/restocking of a spiral.
    - `spiral-empty-dialog.tsx`: UI for recording the emptying of a spiral.
  - **Picklists (Restocking Lists)**:
    - `picklist-form.tsx`: Form for creating or managing picklists.
    - `picklist-generate-dialog.tsx`: UI to trigger the generation of picklists (e.g., based on low stock levels).
    - `picklist-regenerate-dialog.tsx`: UI to regenerate an existing picklist.
    - `picklist-fill-dialog.tsx`: UI for confirming that items on a picklist have been filled/restocked.
    - `picklist-delete-dialog.tsx`: For deleting picklists.
    - `picklist-dropdown.tsx`: Context menu for picklist actions.
  - **General Inventory Controls**:
    - `inventory-controls.tsx`: A general component grouping various inventory actions.
    - `inventory-dropdown.tsx`: Dropdown for general inventory operations.
    - `inventory-empty-dialog.tsx` & `inventory-fill-dialog.tsx`: Dialogs for broader inventory adjustments beyond individual spirals.
- **Server Actions (`actions/inventory.ts`, `actions/product.ts`)**:
  - `actions/product.ts`: Handles server-side logic for product creation, editing, and deletion. Key actions include:
    - `productCreateAction`: Creates a new product. Validates against `productCreateSchema`. Checks for duplicate names (case-insensitive). Operators cannot create products. Redirects to the team's product list on success.
    - `productEditAction`: Updates an existing product. Validates against `productEditSchema`. Checks for duplicate names (case-insensitive, excluding the current product). Operators cannot edit products. Revalidates paths and redirects to the team's product list on success.
    - `productDeleteAction`: Soft-deletes a product. Validates against `productDeleteSchema`. Prevents deletion if the product is in use by any machine spirals. Operators cannot delete products. Revalidates paths and returns a success status.
  - `actions/inventory.ts`: Provides a comprehensive set of server actions for detailed inventory control:
    - **Spiral Management**:
      - `spiralCreateAction`: Creates a new spiral/slot in a machine, validating against `spiralCreateSchema`. Handles DEX/MDB code conflicts. Revalidates paths and redirects.
      - `spiralEditAction`: Modifies an existing spiral, validating against `spiralEditSchema`. Revalidates paths.
      - `spiralDeleteAction`: Soft-deletes a spiral, validating against `spiralDeleteSchema`. Revalidates paths.
      - `spiralFillAction`: Sets a spiral's current stock to its maximum capacity, validating against `spiralFillSchema`. Revalidates paths.
      - `spiralEmptyAction`: Sets a spiral's current stock to zero, validating against `spiralFillSchema` (Note: uses `spiralFillSchema` as per current code). Revalidates paths.
      - `spiralIncrementAction`: Increases a spiral's stock by one, validating against `spiralIncrementSchema`. Revalidates paths.
      - `spiralDecrementAction`: Decreases a spiral's stock by one, validating against `spiralDecrementSchema`. Revalidates paths.
    - **Machine-Level Inventory Operations**:
      - `inventoryFillAction`: Fills all spirals in a machine to capacity, validating against `inventoryFillSchema`. Marks existing picklists as deleted. Revalidates paths.
      - `inventoryEmptyAction`: Empties all spirals in a machine, validating against `inventoryEmptySchema`. Revalidates paths.
    - **Picklist Management**:
      - `picklistGenerateAction`: Creates a picklist for items needing replenishment, validating against `picklistGenerateSchema`. Prevents duplicate active picklists. Revalidates paths and redirects.
      - `picklistEditAction`: Modifies quantities in an active picklist, validating against `picklistEditSchema`. Requires session. Revalidates paths and redirects.
      - `picklistDeleteAction`: Soft-deletes an active picklist, validating against `picklistDeleteSchema`. Revalidates paths and redirects.
      - `picklistRegenerateAction`: Replaces an active picklist with a new one based on current stock, validating against `picklistRegenerateSchema`. Soft-deletes the old picklist. (Note: revalidation/redirect behavior might need confirmation from UI flow as it's not explicit in the action's code).
      - `picklistFillAction`: Marks a picklist as fulfilled and updates spiral stock levels accordingly, validating against `picklistFillSchema`. Revalidates paths and redirects.
      - `picklistExportAction`: Exports an active picklist to a CSV file, validating against `picklistExportSchema`. Returns CSV data or an error.
- **Validation Schemas (`validation/inventory.ts`, `validation/product.ts`)**:
  - Zod schemas for validating data submitted through product and inventory forms.
- **Data Loaders (`loaders/product.ts`)**:
  - Functions for fetching product data, likely used by Server Components. (Loaders for inventory might also exist or be part of machine/route loaders).
- **Database Models (`Product`, `Spiral`, `Picklist`, `Machine` in `prisma/schema.prisma`)**:
  - `Product`: Stores details of each product (ID, name, SKU, price, description).
  - `Spiral` (or similar like `MachineStockItem`): Represents a specific slot in a machine, linking `Machine` to `Product`, and storing `capacity`, `currentStock`, `position`.
  - `Picklist`: Stores information about restocking lists, including items, quantities, and status.
  - `Machine`: Related to `Spiral` to define its inventory layout.

## 3. Core Inventory Management Features

### 3.1. Product Management

Product management functionalities are primarily handled by server actions defined in `actions/product.ts`. These actions ensure data integrity, apply business rules, and manage user permissions.

- **Creating Products (`productCreateAction`)**:

  - **Trigger**: Typically invoked via `product-create-card.tsx` which uses `product-form.tsx`.
  - **Input**: Requires `teamSlug`, `name`, `price` (in cents), and `sku`. Validated by `productCreateSchema`.
  - **Permissions**: Users with the `OPERATOR` role within a team are not permitted to create products.
  - **Logic**:
    - Verifies that no other product with the same name (case-insensitive) exists within the team.
    - Creates a new product record associated with the team and the creating user.
  - **Outcome**: Redirects to the team's product listing page (`/team/[teamSlug]/products`).

- **Viewing Products**:

  - While not a specific server action, product data is fetched using loaders like `getTeamProduct` (from `loaders/product.ts`) for display in various parts of the application, such as a product list page or when configuring machine spirals.

- **Editing Products (`productEditAction`)**:

  - **Trigger**: Typically invoked via a product editing interface, likely `product-edit-card.tsx`.
  - **Input**: Requires `teamSlug`, `productId`, `name`, `price` (in cents), and `sku`. Validated by `productEditSchema`.
  - **Permissions**: Users with the `OPERATOR` role are not permitted to edit products.
  - **Logic**:
    - Verifies that no _other_ product with the new name (case-insensitive) exists within the team.
    - Updates the specified product's details.
  - **Outcome**: Revalidates relevant cache paths (`revalidatePath("/", "layout")`) and redirects to the team's product listing page.

- **Deleting Products (`productDeleteAction`)**:
  - **Trigger**: Typically invoked via `product-delete-dialog.tsx`.
  - **Input**: Requires `teamSlug` and `productId`. Validated by `productDeleteSchema`.
  - **Permissions**: Users with the `OPERATOR` role are not permitted to delete products.
  - **Logic**:
    - Checks if the product is currently assigned to any active machine spirals. If so, deletion is prevented to maintain inventory integrity.
    - Performs a soft delete by setting the `deletedAt` timestamp on the product record.
  - **Outcome**: Revalidates relevant cache paths and returns a success status. Products are not physically removed from the database but are marked as deleted.

### 3.2. Machine Inventory Configuration (Spirals/Slots)

- **Defining Spirals**: For each machine, users can define its internal layout (spirals/slots/channels) using `spiral-create-dialog.tsx`. This involves assigning a product to a specific position within the machine and setting its capacity.
- **Editing/Deleting Spirals**: Configurations can be modified or removed.
- **Tracking Stock per Spiral**: The system tracks `currentStock` for each product in each spiral.

### 3.3. Stock Replenishment and Adjustments

- **Filling Stock**:
  - `spiral-fill-dialog.tsx`: Allows users to record the refilling of specific spirals in a machine.
  - `inventory-fill-dialog.tsx`: Potentially for bulk filling operations.
- **Emptying Stock**:
  - `spiral-empty-dialog.tsx`: Allows users to record the emptying of spirals (e.g., for maintenance, product rotation).
  - `inventory-empty-dialog.tsx`: For broader stock removal.
- **Manual Adjustments**: `spiralIncrementAction` and `spiralDecrementAction` (detailed in `actions/inventory.ts`) allow for fine-grained manual changes to stock levels in individual spirals, typically invoked via specific UI elements.
- **Automatic Stock Updates**: Stock levels are likely automatically decremented when sales are recorded from machines.

### 3.4. Picklist Management

- **Generating Picklists (`picklist-generate-dialog.tsx`)**:
  - The system can generate picklists, likely based on current stock levels falling below a threshold or based on a specific route/machine needing service.
  - This helps service personnel know what products and quantities are needed for restocking.
- **Managing Picklists (`picklist-form.tsx`)**:
  - Viewing and potentially editing generated picklists.
- **Confirming Restock (`picklist-fill-dialog.tsx`)**:
  - After restocking machines based on a picklist, service personnel can confirm that the items have been filled, updating the system's stock records.
- **Regenerating/Deleting Picklists**: Options to regenerate a picklist if needs change or delete obsolete ones, supported by `picklistRegenerateAction` and `picklistDeleteAction`.
- **Exporting Picklists**: `picklistExportAction` allows for downloading picklist data in CSV format for offline use or reporting.

### 3.5. Inventory Visibility

- Users (especially admins or route operators) would have visibility into:
  - Current stock levels for each product across all machines or specific machines.
  - Products that are running low and require restocking.
  - The status of picklists.

Inventory management in Terpa Web is a comprehensive system designed to ensure products are defined correctly, stocked appropriately in machines, and replenished efficiently using picklists. This is vital for the operational success of businesses relying on automated retail or dispensing machines.
