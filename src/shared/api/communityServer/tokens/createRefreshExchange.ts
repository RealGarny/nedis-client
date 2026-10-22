import type { Address } from "@/shared/lib/communityServer";
import type { ExchangeRefresh } from "./tokenProvider.types";
import { HttpError, request } from "@/shared/api/http";
import { refreshEndpoint } from "./refreshEndpoint";
import { NeedLoginError } from "./NeedLoginError";

function createRefreshExchange(address: Address): ExchangeRefresh {
  return async (refreshToken) => {
    try {
      return await request({ href: address.href }, refreshEndpoint, { payload: { refreshToken } });
    } catch (e) {
      if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
        throw new NeedLoginError(address.origin);
      }
      throw e;
    }
  };
}

export { createRefreshExchange };
