import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { Queue, Worker } from "bullmq";

// check env if in nextjs build phase
if (process.env.NEXT_PHASE === "phase-production-build") {
  console.log("Skipping BullMQ in production build");
} else {
  const repeatableQuery = new Queue("exchange-rate-queue", {
    connection: redis,
  });

  // Upserting a repeatable job in the queue
  repeatableQuery.upsertJobScheduler(
    "exchange-rate-scheduler",
    { every: 86_400_000 }, // Every 24 hours (86,400,000 ms)
    {
      name: "daily-exchange-rate-query",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: {
          age: 86_400_000, // 24 hours
        },
      }, // Optional additional job options
    },
  );

  // Worker to process the jobs
  new Worker(
    "exchange-rate-queue",
    async (job: any) => {
      console.log("Calculating exchange rate", job.id);
      const response = await fetch(
        `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos`,
        {
          headers: {
            "Bmx-Token": env.BANXICO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );
      const data = (await response.json()) as {
        bmx: {
          series: Array<{
            datos: Array<{ fecha: string; dato: string }>;
          }>;
        };
      };

      const latest =
        data.bmx.series[0].datos[data.bmx.series[0].datos.length - 1];

      await prisma.exchangeRateHistory.create({
        data: {
          rate: parseFloat(latest.dato),
          fromCurrency: "USD",
          toCurrency: "MXN",
        },
      });

      return true;
    },
    { connection: redis },
  );

  const machineDeactivationQueue = new Queue("machine-deactivation-queue", {
    connection: redis,
  });

  machineDeactivationQueue.add(
    "machine-deactivation-scheduler",
    {},
    {
      repeat: {
        pattern: "0 3 * * *", // Every day at 3 AM
        tz: "America/Mexico_City",
      },
    },
  );

  new Worker(
    "machine-deactivation-queue",
    async (job: any) => {
      console.log("Calling machine deactivation endpoint", job.id);

      const response = await fetch(
        `${env.APP_BASE_URL}/api/cron/deactivate-machines`,
        {
          headers: {
            Authorization: `Bearer ${env.CRON_SECRET}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to deactivate machines: ${await response.text()}`,
        );
      }

      const data = await response.json();
      console.log("Machine deactivation job completed:", data);

      return true;
    },
    { connection: redis },
  );

  const monthlyTasksQueue = new Queue("monthly-tasks-queue", {
    connection: redis,
  });

  // Schedule job to run from the 26th to 31st of each month at 6:00 AM
  monthlyTasksQueue.add(
    "last-weekday-check",
    {},
    {
      repeat: {
        pattern: "0 6 26-31 * *", // 26th-31st of every month at 6:00 AM
        tz: "America/Mexico_City",
      },
    },
  );

  // Schedule job to run on the 15th of each month at 6:00 AM
  monthlyTasksQueue.add(
    "mid-month-task",
    {},
    {
      repeat: {
        pattern: "0 6 15 * *", // 15th of every month at 6:00 AM
        tz: "America/Mexico_City",
      },
    },
  );

  // Schedule job to run on the 20th of each month at 6:00 AM
  monthlyTasksQueue.add(
    "20th-month-task",
    {},
    {
      repeat: {
        pattern: "0 6 20 * *", // 20th of every month at 6:00 AM
        tz: "America/Mexico_City",
      },
    },
  );

  // Schedule job to run on the 25th of each month at 6:00 AM
  monthlyTasksQueue.add(
    "25th-month-task",
    {},
    {
      repeat: {
        pattern: "0 6 25 * *", // 25th of every month at 6:00 AM
        tz: "America/Mexico_City",
      },
    },
  );

  new Worker(
    "monthly-tasks-queue",
    async (job: any) => {
      console.log("Processing monthly task job:", job.name, job.id);

      if (job.name === "last-weekday-check") {
        if (isLastWeekdayOfMonth()) {
          console.log("✅ Today is the last weekday of the month!");
          await callPaymentReminders(job.id, "last weekday");
        } else {
          console.log("⏭️ Not the last weekday of the month, skipping");
        }
      } else if (job.name === "mid-month-task") {
        console.log("✅ Running mid-month task (15th of month)");
        await callPaymentReminders(job.id, "15th of month");
      } else if (job.name === "20th-month-task") {
        console.log("✅ Running 20th month task");
        await callPaymentReminders(job.id, "20th of month");
      } else if (job.name === "25th-month-task") {
        console.log("✅ Running 25th month task");
        await callPaymentReminders(job.id, "25th of month");
      }

      return true;
    },
    { connection: redis },
  );
}

// Helper function to call payment reminders endpoint
async function callPaymentReminders(
  jobId: string,
  context: string,
): Promise<void> {
  console.log(`Calling payment reminders endpoint for ${context}`, jobId);

  const response = await fetch(
    `${env.APP_BASE_URL}/api/cron/payment-reminders`,
    {
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to execute payment reminders: ${await response.text()}`,
    );
  }

  const data = await response.json();
  console.log("Payment reminders job completed:", data);
}

// Helper function to check if today is the last weekday of the month
function isLastWeekdayOfMonth(): boolean {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Get the last day of the current month
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Find the last weekday by working backward from the last day
  let lastWeekday = new Date(lastDayOfMonth);
  while (lastWeekday.getDay() === 0 || lastWeekday.getDay() === 6) {
    lastWeekday.setDate(lastWeekday.getDate() - 1);
  }

  // Check if today is the last weekday
  return today.toDateString() === lastWeekday.toDateString();
}
