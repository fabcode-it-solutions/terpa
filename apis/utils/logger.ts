import pino from "pino";

const logLevel = process.env.LOG_LEVEL || "info";

const baseMeta = {
  app: process.env.LOG_APP_NAME || "terpa-dev",
  node_env: process.env.NODE_ENV,
};

// Structured JSON to stdout only; no external transports
const logger = pino({
  level: logLevel,
  base: baseMeta,
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: "message",
});

export default logger;
