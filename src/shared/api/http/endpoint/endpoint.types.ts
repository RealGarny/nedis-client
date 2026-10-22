type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Whether the route needs credentials, mirroring `RequireAuthorization()` on
 * the server route. Says nothing about HOW to authenticate (bearer, signature):
 * that is the job of the interceptor of whichever pipeline sends the request.
 *
 * Extend the union when a real case appears ("optional": works anonymously,
 * returns more when signed in); switch to a discriminated object only when a
 * per-endpoint parameter appears (e.g. a token audience).
 */
type AuthRequirement = "required" | "none";

type EndpointPath = string;

type EndpointBodyHandler<Treq> = (req: Treq) => unknown;
type EndpointResponseHandler<TRes> = (res: unknown) => TRes;
type EndpointPathParamsHandler<TReq> = (req: TReq) => Readonly<Record<string, string>>;

interface Endpoint<TReq, TRes> {
  readonly method: HttpMethod;
  readonly path: EndpointPath; //relative without "/"
  readonly timeoutMs: number;
  readonly auth: AuthRequirement;
  readonly pathParams: EndpointPathParamsHandler<TReq> | undefined;
  readonly body: EndpointBodyHandler<TReq> | undefined;
  readonly parseResponse: EndpointResponseHandler<TRes>;
}

export type {
  HttpMethod,
  Endpoint,
  EndpointPath,
  AuthRequirement,
  EndpointBodyHandler,
  EndpointResponseHandler,
};
