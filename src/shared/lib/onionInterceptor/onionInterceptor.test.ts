import { InterceptorManager } from "./interceptorManager";
import { prebuildChain } from "./prebuildChain";
import type { Interceptor } from "./types";

describe("interceptorManager", () => {
  const testInterceptor: Interceptor<unknown, void> = (_, next) => {
    console.log("hello, world!");
    return next();
  };

  it("adds items to the store", () => {
    const manager = new InterceptorManager<unknown, void>();
    manager.use(testInterceptor);
    expect(manager.getChain().length).toBe(1);
  });

  it("removes all items from the store", () => {
    const manager = new InterceptorManager<unknown, void>();
    manager.use(testInterceptor);
    manager.clear();
    expect(manager.getChain().length).toBe(0);
  });
});

describe("prebuildChain", () => {
  it("prebuilds in the right order", () => {
    type TCtx = { execution: string[] };
    type TRes = void;

    const manager = new InterceptorManager<TCtx, TRes>();
    const firstInterceptor: Interceptor<TCtx, TRes> = (ctx, next) => {
      ctx.execution.push("one");
      return next();
    };
    const secondInterceptor: Interceptor<TCtx, TRes> = (ctx, next) => {
      ctx.execution.push("two");
      return next();
    };
    manager.use(firstInterceptor);
    manager.use(secondInterceptor);

    const finalChain = prebuildChain(manager, async (ctx) => {
      expect(ctx.execution).toEqual(["one", "two"]);
    });

    finalChain({ execution: [] });
  });

  it("resolves multiple chain runs correctly", async () => {
    type TCtx = { execution: string[] };
    type TRes = TCtx;

    const manager = new InterceptorManager<TCtx, TRes>();
    const firstInterceptor: Interceptor<TCtx, TRes> = async (ctx, next) => {
      ctx.execution.push("one");
      await next();
      ctx.execution.push("one");

      return next();
    };
    const secondInterceptor: Interceptor<TCtx, TRes> = (ctx, next) => {
      ctx.execution.push("two");
      return next();
    };
    manager.use(firstInterceptor);
    manager.use(secondInterceptor);

    const finalChain = prebuildChain(manager, async (ctx) => {
      ctx.execution.push("end");
      return ctx;
    });

    const result = await finalChain({ execution: [] });
    expect(result.execution).toEqual(["one", "two", "end", "one", "two", "end"]);
  });
});
