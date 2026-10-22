import type { RequestInterceptor } from "../types";

const timeoutInterceptor: RequestInterceptor = async (ctx, next) => {
  const timeout = AbortSignal.timeout(ctx.endpoint.timeoutMs);
  const callerSignal = ctx.options?.signal;

  ctx.init.signal = callerSignal ? AbortSignal.any([timeout, callerSignal]) : timeout;
  return next();
};

export { timeoutInterceptor };
