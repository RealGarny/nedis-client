import { readBody } from "./helpers/readbody";
import type { RequestContext, RequestResponse } from "./types";

/** The innermost layer of every pipeline: the actual network call. */
async function performRequest(ctx: RequestContext): Promise<RequestResponse> {
  const response = await fetch(ctx.url, { ...ctx.init, headers: ctx.headers });

  const headers: RequestResponse["headers"] = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    headers,
    data: await readBody(response),
  };
}

export { performRequest };
