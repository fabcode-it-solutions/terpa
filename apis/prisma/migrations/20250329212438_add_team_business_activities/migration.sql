-- CreateEnum
CREATE TYPE "BusinessActivityType" AS ENUM ('FOOD_AND_BEVERAGES', 'RETAIL', 'HEALTH_AND_BEAUTY', 'TECHNOLOGY_AND_ELECTRONICS', 'ENTERTAINMENT_AND_GAMES', 'SERVICES', 'OTHER');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "productServiceDescription" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "team_business_activities" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "teamId" TEXT NOT NULL,
    "type" "BusinessActivityType" NOT NULL,
    "customName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_business_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_business_activities_teamId_type_key" ON "team_business_activities"("teamId", "type");

-- AddForeignKey
ALTER TABLE "team_business_activities" ADD CONSTRAINT "team_business_activities_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
