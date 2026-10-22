import { createEndpoint } from "@/shared/api/http";
import { routes } from "@/shared/api/communityServer";
import type { TokenResponse } from "@/shared/api/communityServer";
import { objectOf } from "@/shared/lib/validate";

type LoginRequest = { login: string; password: string };

function parseLogin(raw: unknown): TokenResponse {
  return objectOf(
    { accessToken: "string", refreshToken: "string", expiresIn: "timestamp" },
    "Login",
  )(raw);
}

const loginEndpoint = createEndpoint({
  method: "POST",
  path: routes.auth.login,
  parseResponse: parseLogin,
  body: (req: LoginRequest) => req,
  auth: "none",
});

export { loginEndpoint };
