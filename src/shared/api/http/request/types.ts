import type { Interceptor } from "@/shared/lib/onionInterceptor";
import type { Endpoint, HttpMethod } from "../endpoint";
import type { RequestArgsOptions } from "./request.types";

interface RequestTarget {
  readonly href: string;
}

interface RequestResponse<TData = unknown> {
  status: number;
  headers: Record<string, string>;
  data: TData;
}

interface RequestContext<TTarget extends RequestTarget = RequestTarget> {
  url: URL;
  target: TTarget;
  options?: RequestArgsOptions;
  endpoint: Endpoint<any, any>;
  headers: Headers;
  init: {
    method: HttpMethod;
    body?: string;
    headers?: Headers;
    signal?: AbortSignal;
  };
}

type RequestInterceptor<TTarget extends RequestTarget = RequestTarget> = Interceptor<
  RequestContext<TTarget>,
  RequestResponse
>;

export type { RequestTarget, RequestInterceptor, RequestContext, RequestResponse };
