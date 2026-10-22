import type { HttpMethod } from "./endpoint";

class HttpError extends Error {
  override readonly name = "HttpError";
  readonly status: number;
  readonly method: HttpMethod;
  readonly path: string;

  constructor(status: number, method: HttpMethod, path: string) {
    super(`${method} ${path} failed with status ${status}`);
    this.status = status;
    this.method = method;
    this.path = path;
  }
}

export { HttpError };
