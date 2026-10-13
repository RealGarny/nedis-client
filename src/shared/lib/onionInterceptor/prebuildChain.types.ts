type CoreAction<TCtx, TResult> = (ctx: TCtx) => Promise<TResult>;
type ChainHandler<TCtx, TResult> = (ctx: TCtx) => Promise<TResult>;

export type { CoreAction, ChainHandler };
