import type { EndpointPath } from "../http/endpoint.types";

const routes = {
  auth: {
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
  },
} as const satisfies Record<string, Readonly<Record<string, EndpointPath>>>;

export { routes };
