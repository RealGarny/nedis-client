import type { EndpointInformation } from "./resolveEndpointUrl.types";

const LEADING_SLASHES = /^\/+/;

/**
 * Resolves the path relative to the server mount prefix, ensuring the result
 * does not escape to a different source or go above the prefix (e.g., absolute URLs, "//host", "../").
 */
export function resolveEndpointUrl(endpoint: EndpointInformation, path: string): URL {
  const base = new URL(endpoint.href);
  if (!base.pathname.endsWith("/")) base.pathname += "/";

  const url = new URL(path.replace(LEADING_SLASHES, ""), base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error(`Request leaves boundaries of ${base.href}: ${url.href}`);
  }
  return url;
}
