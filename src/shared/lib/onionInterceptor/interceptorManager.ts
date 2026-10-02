// 1. Описываем типы контрактов

import type { Interceptor } from "./types";

class InterceptorManager<
  TCtx,
  TResult,
  TInterceptor extends Interceptor<TCtx, TResult> = Interceptor<TCtx, TResult>,
> {
  #interceptors: TInterceptor[] = [];

  public getChain(): readonly TInterceptor[] {
    return this.#interceptors;
  }

  public use(middleware: TInterceptor): void {
    this.#interceptors.push(middleware);
  }

  public clear(): void {
    this.#interceptors = [];
  }
}
export { InterceptorManager };
