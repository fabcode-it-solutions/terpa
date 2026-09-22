-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "productId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_images_productId_deletedAt_idx" ON "product_images"("productId", "deletedAt");

-- CreateIndex
CREATE INDEX "product_images_productId_position_idx" ON "product_images"("productId", "position");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
