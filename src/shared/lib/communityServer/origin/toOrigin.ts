import type { Origin } from "./origin.types";
import { parserUrl } from "./parseUrl";

export function toOrigin(input: string): Origin {
  return parserUrl(input).origin as Origin;
}
