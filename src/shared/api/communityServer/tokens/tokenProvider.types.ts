import type { Origin } from "@/shared/lib/communityServer";
import type { TokenResponse } from "./types";
import type { EventListener } from "@/shared/lib/event";

interface TokenProvider {
  readonly origin: Origin;
  getToken: () => Promise<string>;
  refresh: () => Promise<string>;
  set: (tokenResponse: TokenResponse) => Promise<void>;
  clear: () => Promise<void>;
}

type ExchangeRefresh = (origin: Origin, refresh: string) => Promise<TokenResponse>;

type Options = {
  onRefreshFailed?: EventListener<Origin>;
};

export type { TokenProvider, ExchangeRefresh, Options };
