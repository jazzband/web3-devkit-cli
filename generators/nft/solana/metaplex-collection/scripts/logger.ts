import log, { config, tag } from "@winstonts/winston2";

config({
  env: process.env.NODE_ENV === "production" ? "production" : "development",
  minLevel: process.env.LOG_LEVEL ?? "info",
  colors: process.env.NODE_ENV !== "production",
});

export const scriptLog = tag("metaplex-collection");
export { log };
