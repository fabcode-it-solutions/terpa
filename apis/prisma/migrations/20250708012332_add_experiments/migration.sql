-- CreateTable
CREATE TABLE "experiments" (
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "experiment_teams" (
    "experimentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_teams_pkey" PRIMARY KEY ("experimentId","teamId")
);

-- CreateIndex
CREATE INDEX "experiment_teams_teamId_idx" ON "experiment_teams"("teamId");

-- CreateIndex
CREATE INDEX "experiment_teams_experimentId_idx" ON "experiment_teams"("experimentId");

-- AddForeignKey
ALTER TABLE "experiment_teams" ADD CONSTRAINT "experiment_teams_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_teams" ADD CONSTRAINT "experiment_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
