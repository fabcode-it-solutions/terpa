-- CreateTable
CREATE TABLE "team_onboarding_tasks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_onboarding_task_history" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "previousValue" BOOLEAN NOT NULL,
    "newValue" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "team_onboarding_task_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_onboarding_tasks_teamId_key_key" ON "team_onboarding_tasks"("teamId", "key");

-- AddForeignKey
ALTER TABLE "team_onboarding_tasks" ADD CONSTRAINT "team_onboarding_tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_onboarding_task_history" ADD CONSTRAINT "team_onboarding_task_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_onboarding_task_history" ADD CONSTRAINT "team_onboarding_task_history_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
