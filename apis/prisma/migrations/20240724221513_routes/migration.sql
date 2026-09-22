-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_machines" (
    "routeId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "route_machines_pkey" PRIMARY KEY ("routeId","machineId")
);

-- CreateIndex
CREATE UNIQUE INDEX "route_machines_routeId_machineId_key" ON "route_machines"("routeId", "machineId");

-- AddForeignKey
ALTER TABLE "route_machines" ADD CONSTRAINT "route_machines_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_machines" ADD CONSTRAINT "route_machines_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
