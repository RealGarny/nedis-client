import type { Interceptor } from "../types";

const jsonFallbackInterceptor: Interceptor = (ctx, next) => {
  // Without it fetch sends a string body as text/plain
  if (ctx.init.body !== undefined && !ctx.headers.has("Content-type")) {
    ctx.headers.set("Content-Type", "application/json");
  }
  return next();
};

export { jsonFallbackInterceptor };
