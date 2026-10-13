import type { InterceptorManager } from "./InterceptorManager";
import type { ChainHandler, CoreAction } from "./prebuildChain.types";

function prebuildChain<TCtx, TResult>(
  manager: InterceptorManager<TCtx, TResult>,
  coreAction: CoreAction<TCtx, TResult>,
): ChainHandler<TCtx, TResult> {
  const middlewares = manager.getChain();

  let nextFn: ChainHandler<TCtx, TResult> = async (ctx) => {
    return await coreAction(ctx);
  };

  for (let i = middlewares.length - 1; i >= 0; i--) {
    const currentMiddleware = middlewares[i];
    const prevNext = nextFn;

    nextFn = async (ctx) => {
      return await currentMiddleware(ctx, () => prevNext(ctx));
    };
  }

  return nextFn;
}

export { prebuildChain };
