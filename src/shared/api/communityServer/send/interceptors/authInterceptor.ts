import type { RequestInterceptor } from "@/shared/api/http/request/types";
import type { SessionContract } from "../types";

const authInterceptor: RequestInterceptor<SessionContract> = async (ctx, next) => {
  if (ctx.endpoint.auth !== "required") return next();

  const { tokens } = ctx.target;

  ctx.headers.set("Authorization", `Bearer ${await tokens.getToken()}`);

  const response = await next();

  if (response.status !== 401) return response;
  // The header must be rewritten: `next()` re-runs the inner layers with the
  // same ctx, and the old token would otherwise go out again.
  ctx.headers.set("Authorization", `Bearer ${await tokens.refresh()}`);
  return next();
};

export { authInterceptor };
