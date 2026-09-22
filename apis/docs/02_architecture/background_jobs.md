# Background Jobs: Terpa Web

This document details the background job processing system in Terpa Web, which appears to utilize BullMQ and Redis.

## 1. Overview

Background jobs are tasks that are processed outside of the main request/response cycle of a web application. This is useful for:

- Offloading long-running tasks that would otherwise make users wait (e.g., generating large reports, sending bulk emails).
- Scheduling tasks to run at specific times or intervals (e.g., nightly cleanups, recurring invoice generation).
- Handling tasks that can fail and need retries (e.g., calling external APIs that might be temporarily unavailable).

Terpa Web uses **BullMQ**, a robust and fast job queue system for Node.js, built on top of **Redis**.

## 2. Key Components and Libraries

- **BullMQ (`bullmq` dependency):**
  - The core library for defining job queues, adding jobs to queues, and processing jobs with workers.
  - Provides features like job prioritization, rate limiting, delayed jobs, repeatable jobs, and comprehensive event tracking.
- **Redis (`ioredis` dependency):**
  - An in-memory data store used by BullMQ as its backend for storing job data, queue state, and facilitating communication between producers (those adding jobs) and consumers (workers processing jobs).
  - The `ioredis` library is a high-performance Node.js client for Redis.
- **Configuration (`lib/bullmq.ts`, `lib/redis.ts`):**
  - `lib/redis.ts`: Likely contains the setup and instantiation of the Redis client connection using `ioredis`, configured via environment variables (e.g., `REDIS_URL`).
  - `lib/bullmq.ts`: This file would typically define:
    - Instances of BullMQ `Queue` objects for different types of jobs (e.g., `emailQueue`, `reportGenerationQueue`). Each queue connects to the Redis instance.
    - Instances of BullMQ `Worker` objects that listen to specific queues and process jobs. Worker functions contain the actual logic for executing a job.
    - (Potentially) A `QueueScheduler` if advanced features like delayed jobs or rate limiting are heavily used, though BullMQ handles many common cases without it.

## 3. How it Works (Typical BullMQ Flow)

1.  **Defining a Queue:**

    - A queue is created using `new Queue('queueName', { connection: redisConnection })` in `lib/bullmq.ts` or where queues are managed.
    - `'queueName'` is a unique identifier for this type of job (e.g., `'emailSending'`, `'invoiceProcessing'`).

2.  **Adding Jobs to a Queue (Producing Jobs):**

    - Elsewhere in the application (e.g., in a Server Action, API Route, or even another service), when a background task needs to be performed, a job is added to the appropriate queue.
    - Example: `emailQueue.add('sendWelcomeEmail', { userId: user.id, email: user.email });`
      - `'sendWelcomeEmail'` is the name of the job (identifies the type of task within this queue).
      - The second argument is the job's `data` payload, containing information needed by the worker to process the job.
    - Jobs can be added with options like delays, priority, or recurrence patterns.

3.  **Processing Jobs with Workers (Consuming Jobs):**

    - A `Worker` is defined for each queue (or one worker can process multiple queues, though less common for separation).
    - Example: `new Worker('emailSending', async job => { /* logic to send email using job.data */ }, { connection: redisConnection });`
    - The worker listens for new jobs on its designated queue(s).
    - When a job is available, the worker picks it up and executes the provided asynchronous processor function.
    - The processor function receives the `job` object, which includes `job.data` (the payload) and methods to report progress, log, or handle completion/failure.
    - Workers are typically run as separate, long-running Node.js processes. How these are started and managed in a Next.js environment needs to be considered (e.g., a separate script `npm run start-workers`, or integration into the main application process if designed for serverless environments, though less common for persistent workers).

4.  **Job Lifecycle and Events:**
    - BullMQ manages the lifecycle of jobs (waiting, active, completed, failed, delayed).
    - It emits events for these state changes, which can be listened to for monitoring, logging, or triggering other actions.

## 4. Potential Use Cases in Terpa Web

Given the features of Terpa Web, BullMQ could be used for:

- **Email Sending (`service/mailer.ts`):** Sending transactional emails (welcome emails, password resets, invoice notifications) asynchronously.
- **Report Generation:** Generating complex reports (e.g., sales summaries, inventory audits) that might take time.
- **Invoice Processing:** Batch generation of invoices at the end of a billing cycle.
- **Data Synchronization:** Syncing data with external services.
- **Webhook Processing:** Handling incoming webhooks from services like MercadoPago asynchronously to avoid blocking the webhook acknowledgement.
- **Scheduled Tasks:**
  - Nightly database cleanup or maintenance.
  - Checking for overdue invoices and sending reminders.
  - Updating machine statuses based on scheduled checks.
- **Payment Reminder System (`lib/payment-reminders.ts`):**
  - **Schedule**: Automated payment reminders run twice monthly via BullMQ workers:
    - **Mid-month**: 15th of each month at 6:00 AM Mexico City time
    - **End-of-month**: Last weekday of each month at 6:00 AM Mexico City time
  - **Process**: Workers call the `/api/cron/payment-reminders` endpoint which:
    1. Queries teams with machines expiring in the next month
    2. Sends email reminders to team owners via SendGrid
    3. Logs all email attempts with success/failure status
    4. Returns statistics on emails sent and failed
  - **Error Handling**: Failed email sends are logged with `FAILED` status for monitoring and debugging
  - **Manual Triggering**: The payment reminders endpoint can also be called manually for testing or immediate execution

## 5. Running Workers

- **Development:** Workers might be started with a separate npm script (e.g., `npm run workers`).
- **Production:** Worker processes need to be deployed and managed alongside the main web application. This could involve:
  - Running them as separate services on a PaaS (e.g., Heroku worker dynos, AWS ECS tasks).
  - Using process managers like PM2 if deploying to a traditional server.
  - If using serverless functions for workers, the architecture would be different, with queues triggering function invocations.

## 6. Monitoring and Management

- BullMQ offers add-on UI packages (like `@bull-board/express` or `@bull-board/fastify`) that can be integrated to provide a dashboard for monitoring queues, jobs, and workers. It's not explicitly listed as a dependency, but it's a common addition for managing BullMQ setups.
- Logging within worker processes is crucial for debugging and tracking job execution.

The use of BullMQ and Redis indicates a robust approach to handling tasks that benefit from asynchronous processing, improving the responsiveness and reliability of Terpa Web.
