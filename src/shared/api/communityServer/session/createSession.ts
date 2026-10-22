import type { Address } from "@/shared/lib/communityServer";
import type { SessionContract } from "../send";
import { createRefreshExchange, createTokenProvider, type Options } from "../tokens";

function createSession(address: Address, tokenProviderOptions: Options): SessionContract {
  const tokens = createTokenProvider(
    address.origin,
    createRefreshExchange(address),
    tokenProviderOptions,
  );
  return {
    ...address,
    tokens,
  };
}

export { createSession };
