import type {
  AuthMethod,
  EndpointBodyHandler,
  EndpointPath,
  EndpointResponseHandler,
  HttpMethod,
} from "./endpoint.types";

type PathParamNames<P extends string> = P extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PathParamNames<Rest>
  : never;

type PathParamsOption<P extends string, TReq> = [PathParamNames<P>] extends [never]
  ? {
      pathParams?: never;
    }
  : {
      pathParams: (req: TReq) => Record<PathParamNames<P>, string>;
    };

type EndpointSpec<P extends EndpointPath, TReq, TRes> = {
  method: HttpMethod;
  path: P;
  auth?: AuthMethod;
  timeoutMs?: number;
  body?: EndpointBodyHandler<TReq>;
  parseResponse: EndpointResponseHandler<TRes>;
} & PathParamsOption<P, TReq>;

export type { EndpointSpec };
