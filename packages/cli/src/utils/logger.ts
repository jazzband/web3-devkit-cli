import log, { config, tag, type LoggerConfig } from "@winstonts/winston2";

export { log };

/** Tagged logger for CLI user-facing output. */
export const cli = tag("web3");

let initialized = false;

function resolveEnv(): LoggerConfig["env"] {
  const raw = process.env.WEB3_LOG_ENV ?? process.env.NODE_ENV ?? "development";
  if (raw === "production" || raw === "test") return raw;
  return "development";
}

function resolveMinLevel(): LoggerConfig["minLevel"] {
  const raw = (process.env.WEB3_LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "warn" || raw === "error") return raw;
  return "info";
}

/** Configure @winstonts/winston2 once at CLI startup. */
export function initLogger(): void {
  if (initialized) return;

  const env = resolveEnv();
  const minLevel = resolveMinLevel();
  const logFile = process.env.WEB3_LOG_FILE;

  const cfg: LoggerConfig = {
    env,
    minLevel,
    debug: minLevel === "debug",
    colors: env === "development",
    hooks: {
      minLevel: (process.env.WEB3_LOG_HOOK_LEVEL as LoggerConfig["minLevel"]) ?? "error",
      discord: {
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL ?? "",
      },
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
      },
      telegram: {
        enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
        chatId: process.env.TELEGRAM_CHAT_ID ?? "",
      },
    },
  };

  if (logFile) {
    cfg.file = {
      enabled: true,
      filePath: logFile,
      rotation: {
        strategy: (process.env.WEB3_LOG_ROTATION as "1H" | "1D" | "1W") ?? "1D",
        maxFiles: Number(process.env.WEB3_LOG_MAX_FILES ?? 7),
      },
      flushIntervalMs: Number(process.env.WEB3_LOG_FLUSH_MS ?? 2000),
      prettyJson: env === "development",
    };
  }

  config(cfg);
  initialized = true;

  process.on("beforeExit", () => {
    void log.flush();
  });
}

/** User-facing line (chalk-formatted strings). */
export function writeln(message = ""): void {
  cli.info(message);
}

/** Warning / cancelled messages. */
export function writeWarn(message: string): void {
  cli.warn(message);
}

/** Machine-readable JSON on stdout (no log prefixes; safe for piping). */
export function writeJson(data: unknown, pretty = true): void {
  const text = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  process.stdout.write(`${text}\n`);
}

/** Raw stdout for eval/piping (e.g. config path). */
export function writeRaw(text: string): void {
  process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}
