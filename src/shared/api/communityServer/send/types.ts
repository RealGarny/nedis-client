import type { Endpoint, HttpMethod } from "@/shared/api/http";
import type { Interceptor as OnionInterceptor } from "@/shared/lib/onionInterceptor";
import type { SendArgsOptions } from "./send.types";
import type { TokenProvider } from "../tokens";
import type { Origin } from "@/shared/lib/communityServer";

interface BaseResponse<TData = unknown> {
  status: number;
  headers: Record<string, string>;
  data: TData;
}

interface SessionContract {
  readonly origin: Origin;
  readonly href: string;
  readonly tokens: TokenProvider;
}

interface BaseContext {
  url: URL;
  serverSession: SessionContract;
  options?: SendArgsOptions;
  endpoint: Endpoint<any, any>;
  headers: Headers;
  init: {
    method: HttpMethod;
    body?: string;
    headers?: Headers;
    signal?: AbortSignal;
  };
}

type Interceptor = OnionInterceptor<BaseContext, BaseResponse>;

export type { BaseContext, BaseResponse, Interceptor, SessionContract };
