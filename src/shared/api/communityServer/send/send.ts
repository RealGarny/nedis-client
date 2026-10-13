import { HttpError, type Endpoint } from "@/shared/api/http";
import { fillPath } from "./fillPath";
import type { SendRest } from "./send.types";
import { resolveEndpointUrl } from "@/shared/lib/resolveEndpointUrl";
import * as OnionInterceptor from "@/shared/lib/onionInterceptor";
import type { BaseContext, BaseResponse, SessionContract } from "./types";
import { authInterceptor } from "./interceptors/authInterceptor";
import { timeoutInterceptor } from "./interceptors/timeoutInterceptor";
import { readBody } from "./readbody";
import { jsonFallbackInterceptor } from "./interceptors/jsonFallbackInterceptor";

async function peformRequest(ctx: BaseContext): Promise<BaseResponse> {
  ctx.init.headers = ctx.headers;

  const response = await fetch(ctx.url, ctx.init);
  const headers: BaseResponse["headers"] = {};
  response.headers.forEach((v, k) => {
    headers[k] = v;
  });

  return {
    status: response.status,
    headers,
    data: await readBody(response),
  };
}

const createSend = <TCtx extends BaseContext>(
  interceptors: OnionInterceptor.Interceptor<TCtx, BaseResponse>[],
) => {
  const interceptorManager = new OnionInterceptor.InterceptorManager<TCtx, BaseResponse>();
  interceptors.forEach((interceptor) => interceptorManager.use(interceptor));
  const dispatch = OnionInterceptor.prebuildChain(interceptorManager, peformRequest);

  return async function send<TReq, TRes>(
    serverSession: SessionContract,
    endpoint: Endpoint<TReq, TRes>,
    ...[args]: SendRest<TReq>
  ): Promise<TRes> {
    //TODO: remove explicit cast
    //right now, i cannot narrow the type to just TReq
    //SendArgs type should guard the undefined behaviour for now
    const payload = args?.payload as TReq;
    const options = args?.options;
    const body = endpoint.body?.(payload);
    const filledPath = fillPath(endpoint.path, endpoint.pathParams?.(payload));
    const headers = new Headers(options?.headers || {});

    const ctx: BaseContext = {
      url: resolveEndpointUrl(serverSession, filledPath),
      serverSession,
      options,
      endpoint,
      headers,
      init: {
        method: endpoint.method,
        body: body ? JSON.stringify(body) : undefined,
      },
    };

    const response = await dispatch(ctx as TCtx);
    if (response.status < 200 || response.status >= 300) {
      throw new HttpError(response.status, endpoint.method, endpoint.path);
    }

    return endpoint.parseResponse(response.data);
  };
};

const send = createSend([jsonFallbackInterceptor, authInterceptor, timeoutInterceptor]);

export { send };
