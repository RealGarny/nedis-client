import type { EndpointInformation } from "./resolveEndpointUrl.types";

const LEADING_SLASHES = /^\/+/;

/**
 * Resolves the path relative to the server mount prefix, ensuring the result
 * does not escape to a different source or go above the prefix (e.g., absolute URLs, "//host", "../").
 */
export function resolveEndpointUrl(endpoint: EndpointInformation, path: string): URL {
  const url = new URL(path.replace(LEADING_SLASHES, ""), endpoint.href);
  if (url.origin !== endpoint.origin || !url.pathname.startsWith(endpoint.basePathname)) {
    throw new Error(`Request leaves boundaries of ${endpoint.href}: ${url.href}`);
  }
  return url;
}
