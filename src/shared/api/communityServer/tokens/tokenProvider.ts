import { appConfig } from "@/shared/config";
import type { ExchangeRefresh, Options, TokenProvider } from "./tokenProvider.types";
import type { CachedAccessToken, TokenResponse } from "./types";
import { deleteRefreshToken, loadRefreshToken, saveRefreshToken } from "./tokenStore";
import { NeedLoginError } from "./NeedLoginError";
import type { Origin } from "@/shared/lib/communityServer";

// amount of time in which the token is alredy deemed as expired
const ENTRY_SKEW_MS = 30_000;

export const createTokenProvider = (
  origin: Origin,
  exchangeRefresh: ExchangeRefresh,
  { onRefreshFailed }: Options,
): TokenProvider => {
  let cached: CachedAccessToken | null = null;

  //all consumers that want to refresh the token should await the same request
  let inflight: Promise<string> | null = null;

  const isFresh = (entry: CachedAccessToken | null): entry is CachedAccessToken => {
    return entry !== null && entry.expiresAtMs - Date.now() > ENTRY_SKEW_MS;
  };

  const cache = (response: TokenResponse) => {
    cached = {
      token: response.accessToken,
      expiresAtMs: response.expiresIn + Date.now(),
    };
    return response.accessToken;
  };

  const withLock = async <T>(body: () => Promise<T>): Promise<T> => {
    if (!navigator.locks) return body();
    return await navigator.locks.request(`${appConfig.appName}-refresh:${origin}`, body);
  };

  const dropCache = (): void => {
    cached = null;
  };

  const doRefresh = (): Promise<string> =>
    withLock(async () => {
      if (isFresh(cached)) return cached.token;
      const refreshToken = await loadRefreshToken(origin);

      if (!refreshToken) throw new NeedLoginError(origin);

      let response: TokenResponse;
      try {
        response = await exchangeRefresh(origin, refreshToken);
      } catch (e) {
        if (e instanceof NeedLoginError) {
          await deleteRefreshToken(origin);
          dropCache();
          onRefreshFailed?.(origin);
        }

        throw e;
      }

      await saveRefreshToken(origin, response.refreshToken);
      return cache(response);
    });

  const getToken = (): Promise<string> => {
    if (isFresh(cached)) return Promise.resolve(cached.token);

    inflight ??= doRefresh().finally(() => {
      inflight = null;
    });

    return inflight;
  };

  const refresh = (): Promise<string> => {
    dropCache();
    return getToken();
  };

  const set = async (response: TokenResponse): Promise<void> => {
    await saveRefreshToken(origin, response.refreshToken);
    cache(response);
  };

  const clear = async () => {
    dropCache();
    await deleteRefreshToken(origin);
  };

  return {
    origin,
    set,
    refresh,
    getToken,
    clear,
  };
};
