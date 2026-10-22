import type { PrettifyObject } from "@/shared/types/prettifyObject";

interface RequestArgsOptions {
  readonly signal?: AbortSignal | undefined;
  readonly headers?: Record<string, string>;
}

type PayloadField<TReq> = [TReq] extends [undefined] ? { payload?: undefined } : { payload: TReq };

type RequestArgs<TReq> = PrettifyObject<
  PayloadField<TReq> & {
    options?: RequestArgsOptions;
  }
>;

type RequestRest<TReq> = [TReq] extends [undefined]
  ? [args?: RequestArgs<TReq>]
  : [args: RequestArgs<TReq>];

export type { RequestArgs, RequestArgsOptions, RequestRest };
