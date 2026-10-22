import type { Address } from "@/shared/lib/communityServer";
import type { TokenProvider } from "../tokens";

interface SessionContract extends Address {
  readonly tokens: TokenProvider;
}

export type { SessionContract };
