type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type AuthMethod = "bearer" | "none";

type EndpointPath = string;

type EndpointBodyHandler<Treq> = (req: Treq) => unknown;
type EndpointResponseHandler<TRes> = (res: unknown) => TRes;
type EndpointPathParamsHandler<TReq> = (req: TReq) => Readonly<Record<string, string>>;

interface Endpoint<TReq, TRes> {
  readonly method: HttpMethod;
  readonly path: EndpointPath; //relative without "/"
  readonly timeoutMs: number;
  readonly auth: AuthMethod;
  readonly pathParams: EndpointPathParamsHandler<TReq> | undefined;
  readonly body: EndpointBodyHandler<TReq> | undefined;
  readonly parseResponse: EndpointResponseHandler<TRes>;
}

export type {
  HttpMethod,
  Endpoint,
  EndpointPath,
  AuthMethod,
  EndpointBodyHandler,
  EndpointResponseHandler,
};
