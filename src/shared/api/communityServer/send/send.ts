import { createRequest, timeoutInterceptor } from "@/shared/api/http";
import { authInterceptor } from "./interceptors/authInterceptor";

const send = createRequest([authInterceptor, timeoutInterceptor]);

export { send };
