import type { Origin } from "../origin";
import { parserUrl } from "../origin/parseUrl";
import type { Address } from "./address.types";

function toAddress(input: string): Address {
  const url = parserUrl(input);
  const pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;

  return {
    origin: url.origin as Origin,
    href: `${url.origin}${pathname}`,
  };
}

export { toAddress };
