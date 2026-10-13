import type { PrettifyObject } from "@/shared/types/prettifyObject";

interface SendArgsOptions {
  readonly signal?: AbortSignal | undefined;
  readonly headers?: Record<string, string>;
}

type PayloadField<TReq> = [TReq] extends [undefined] ? { payload?: undefined } : { payload: TReq };

type SendArgs<TReq> = PrettifyObject<
  PayloadField<TReq> & {
    options?: SendArgsOptions;
  }
>;

type SendRest<TReq> = [TReq] extends [undefined] ? [args?: SendArgs<TReq>] : [args: SendArgs<TReq>];

export type { SendArgs, SendArgsOptions, SendRest };
