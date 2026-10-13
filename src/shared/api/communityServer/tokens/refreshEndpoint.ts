import { createEndpoint } from "@/shared/api/http";
import { routes } from "../routes";
import type { TokenRequest, TokenResponse } from "./types";
import { objectOf } from "@/shared/lib/validate";

function parseRefresh(raw: unknown): TokenResponse {
  return objectOf(
    { accessToken: "string", refreshToken: "string", expiresIn: "timestamp" },
    "Refresh",
  )(raw);
}

const refreshEndpoint = createEndpoint({
  method: "POST",
  path: routes.auth.refresh,
  body: (req: TokenRequest) => req,
  parseResponse: parseRefresh,
  auth: "none",
});

export { refreshEndpoint };
