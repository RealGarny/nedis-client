import { appConfig } from "@/shared/config";
import type { Origin } from "./origin.types";

export function toOrigin(input: string): Origin {
  const url = new URL(input.includes("://") ? input : `https://${input}`);
  const isDev = appConfig.dev && url.protocol === "http:";

  if (url.protocol !== "https:" && !isDev) {
    throw new Error(`Insecure server URL: ${input}`);
  }
  return url.origin as Origin;
}
