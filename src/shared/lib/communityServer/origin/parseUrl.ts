import { appConfig } from "@/shared/config";

/**
 * The one place where user input becomes a server URL: scheme defaults to
 * https, plain http is allowed only in development. Everything that derives
 * something from a server address (origin, mount point) goes through here, so
 * the rules cannot drift apart.
 */
function parserUrl(input: string): URL {
  const url = new URL(input.includes("://") ? input : `https://${input}`);
  const isDevHttp = appConfig.dev && url.protocol === "http:";

  if (url.protocol !== "https:" && !isDevHttp) {
    throw new Error(`Insecure server URL: ${input}`);
  }
  return url;
}

export { parserUrl };
