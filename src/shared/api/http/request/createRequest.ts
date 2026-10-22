import * as OnionInterceptor from "@/shared/lib/onionInterceptor";
import { resolveEndpointUrl } from "@/shared/lib/resolveEndpointUrl";
import type { Endpoint } from "../endpoint";
import { HttpError } from "../HttpError";
import { fillPath } from "./helpers/fillPath";
import { performRequest } from "./performRequest";
import type { RequestRest } from "./request.types";
import type { RequestContext, RequestInterceptor, RequestResponse, RequestTarget } from "./types";
import { resolveContentType } from "./helpers/resolveContentType";

/**
 * Builds a request pipeline: everything a request needs regardless of who
 * sends it (URL, body, Content-Type, status check, response parsing), plus the
 * interceptors that make this pipeline different from others.
 *
 * Knows nothing about sessions or tokens. A pipeline that needs credentials
 * passes a richer TTarget and an interceptor that reads them from it.
 *
 * Interceptor order matters: the first one is the outermost layer. A layer that
 * retries (auth) must come before a layer that should run again on the retry
 * (timeout), otherwise the retry inherits what is left of the first timeout.
 */
function createRequest<TTarget extends RequestTarget>(
  interceptors: readonly RequestInterceptor<TTarget>[],
) {
  const manager = new OnionInterceptor.InterceptorManager<
    RequestContext<TTarget>,
    RequestResponse
  >();
  for (const interceptor of interceptors) manager.use(interceptor);
  const dispatch = OnionInterceptor.prebuildChain(manager, performRequest);

  return async function request<TReq, TRes>(
    target: TTarget,
    endpoint: Endpoint<TReq, TRes>,
    ...[args]: RequestRest<TReq>
  ): Promise<TRes> {
    // Sound: RequestRest makes `args.payload` mandatory whenever TReq is not
    // `undefined`, and when it is, `undefined` is exactly TReq.
    const payload = args?.payload as TReq;
    const options = args?.options;

    const headers = new Headers(options?.headers);
    const body = endpoint.body?.(payload);

    // Without it fetch sends a string body.
    resolveContentType(body, headers);

    const ctx: RequestContext<TTarget> = {
      url: resolveEndpointUrl(target, fillPath(endpoint.path, endpoint.pathParams?.(payload))),
      target,
      options,
      endpoint,
      headers,
      init: {
        method: endpoint.method,
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    };

    const response = await dispatch(ctx);
    if (response.status < 200 || response.status >= 300) {
      throw new HttpError(response.status, endpoint.method, endpoint.path);
    }
    return endpoint.parseResponse(response.data);
  };
}

export { createRequest };
