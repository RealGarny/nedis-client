import type { RequestInterceptor } from "../types";

/**
 * A pipeline without credentials refuses routes that require them, before any
 * network traffic. Otherwise the endpoint's `auth` would be silently ignored
 * and the mistake would surface only as a 401 from the server.
 *
 * Does not know HOW anything authenticates, only that this pipeline cannot.
 */
const anonymousOnlyInterceptor: RequestInterceptor = async (ctx, next) => {
  if (ctx.endpoint.auth !== "none") {
    throw new Error(
      `${ctx.endpoint.method} ${ctx.endpoint.path} requires auth: send it through an authenticated pipeline`,
    );
  }
  return next();
};

export { anonymousOnlyInterceptor };
