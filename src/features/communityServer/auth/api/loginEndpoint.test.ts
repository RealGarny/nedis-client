import { send } from "@/shared/api/communityServer";
import type { SessionContract } from "@/shared/api/communityServer";
import { HttpError } from "@/shared/api/http";
import type { Origin } from "@/shared/lib/communityServer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loginEndpoint } from "./loginEndpoint";

function sessionWithoutTokens(): SessionContract {
  const fail = vi.fn(async () => {
    throw new Error("login must not touch the token provider");
  });
  return {
    origin: "https://srv.example" as Origin,
    href: "https://srv.example/",
    tokens: {
      origin: "https://srv.example" as Origin,
      getToken: fail,
      refresh: fail,
      set: vi.fn(async () => {}),
      clear: vi.fn(async () => {}),
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login endpoint", () => {
  it("posts credentials without a bearer token and parses the token pair", async () => {
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, _init?: RequestInit) =>
        new Response(JSON.stringify({ accessToken: "a", refreshToken: "r", expiresIn: 900 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await send(sessionWithoutTokens(), loginEndpoint, {
      payload: { login: "alice", password: "password123" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(String(url)).toBe("https://srv.example/api/auth/login");
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(result).toEqual({ accessToken: "a", refreshToken: "r", expiresIn: 900 });
  });

  it("reports wrong credentials as HttpError 401 without trying to refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    const session = sessionWithoutTokens();

    const error = await send(session, loginEndpoint, {
      payload: { login: "alice", password: "wrong" },
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(401);
    expect(session.tokens.refresh).not.toHaveBeenCalled();
  });
});
