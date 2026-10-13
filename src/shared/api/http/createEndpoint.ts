import type { EndpointSpec } from "./createEndpoint.types";
import type { Endpoint, EndpointPath } from "./endpoint.types";

const DEFAULT_TIMEOUS_MS = 15000;

function createEndpoint<P extends EndpointPath, TReq = undefined, TRes = unknown>(
  spec: EndpointSpec<P, TReq, TRes>,
): Endpoint<TReq, TRes> {
  return {
    method: spec.method,
    path: spec.path,
    pathParams: spec.pathParams,
    body: spec.body,
    parseResponse: spec.parseResponse,
    auth: spec.auth ?? "bearer",
    timeoutMs: spec.timeoutMs ?? DEFAULT_TIMEOUS_MS,
  };
}

export { createEndpoint };
