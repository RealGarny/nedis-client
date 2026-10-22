import { createRequest } from "./createRequest";
import { anonymousOnlyInterceptor } from "./interceptors/annonymousOnlyInterceptor";
import { timeoutInterceptor } from "./interceptors/timeoutInterceptor";
import type { RequestTarget } from "./types";

const request = createRequest<RequestTarget>([anonymousOnlyInterceptor, timeoutInterceptor]);

export { request };
