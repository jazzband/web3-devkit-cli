import log, { config, tag } from "@winstonts/winston2";

const env =
  process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";

config({
  env,
  minLevel: process.env.LOG_LEVEL ?? "info",
  colors: env === "development",
  file: process.env.LOG_FILE
    ? {
        enabled: true,
        filePath: process.env.LOG_FILE,
        rotation: { strategy: "1D", maxFiles: 7 },
        flushIntervalMs: 2000,
        prettyJson: true,
      }
    : undefined,
});

export const apiLog = tag("api");
export { log };
