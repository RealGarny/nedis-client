type Interceptor<TCtx, TResult> = (ctx: TCtx, next: () => Promise<TResult>) => Promise<TResult>;

export type { Interceptor };
