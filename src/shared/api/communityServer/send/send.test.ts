import { HttpError, createEndpoint } from "@/shared/api/http";
import type { Origin } from "@/shared/lib/communityServer";
import { objectOf } from "@/shared/lib/validate";
import { ContractError } from "@/shared/lib/validate/ContractError";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { send } from "./send";
import type { SessionContract } from "./types";

interface RecordedCall {
  url: string;
  method: string | undefined;
  headers: Headers;
  body: string | undefined;
  signal: AbortSignal | undefined;
}

let calls: RecordedCall[] = [];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function empty(status: number): Response {
  return new Response(null, { status });
}

/** Replies with the given responses in order; behaves like fetch on an aborted signal. */
function mockFetch(...responses: Response[]) {
  calls = [];
  const fetchMock = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method,
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
      signal: init?.signal ?? undefined,
    });
    if (init?.signal?.aborted) throw init.signal.reason;
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra request");

    return next;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function createSession(): SessionContract {
  let token = "old-token";
  return {
    origin: "https://srv.example" as Origin,
    href: "https://srv.example/nedis/",
    tokens: {
      origin: "https://srv.example" as Origin,
      getToken: vi.fn(async () => token),
      refresh: vi.fn(async () => {
        token = "new-token";
        return token;
      }),
      set: vi.fn(async () => {}),
      clear: vi.fn(async () => {}),
    },
  };
}

const listChannels = createEndpoint({
  method: "GET",
  path: "api/chat/channels",
  parseResponse: (raw) => raw,
});

const createChannel = createEndpoint({
  method: "POST",
  path: "api/chat/channels",
  body: (req: { name: string }) => req,
  parseResponse: objectOf({ id: "string", name: "string" }, "Channel"),
});

const publicEndpoint = createEndpoint({
  method: "POST",
  path: "api/auth/login",
  auth: "none",
  body: (req: { login: string }) => req,
  parseResponse: (raw) => raw,
});

const channelMessages = createEndpoint({
  method: "GET",
  path: "api/chat/channels/{id}/messages",
  pathParams: (req: { id: string }) => ({ id: req.id }),
  parseResponse: (raw) => raw,
});

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("send: request", () => {
  it("resolves the path against the server mount prefix", async () => {
    mockFetch(json(200, []));
    await send(createSession(), listChannels);
    expect(calls[0].url).toBe("https://srv.example/nedis/api/chat/channels");
    expect(calls[0].method).toBe("GET");
  });

  it("sends a JSON body with Content-Type: application/json", async () => {
    mockFetch(json(201, { id: "c1", name: "general" }));
    await send(createSession(), createChannel, { payload: { name: "general" } });

    expect(calls[0].headers.get("Content-Type")).toBe("application/json");
    expect(calls[0].body).toBe(JSON.stringify({ name: "general" }));
  });

  it("sends no body and no Content-Type when the endpoint has no body", async () => {
    mockFetch(json(200, []));
    await send(createSession(), listChannels);

    expect(calls[0].body).toBeUndefined();
    expect(calls[0].headers.has("Content-Type")).toBe(false);
  });

  it("keeps a Content-Type the caller set explicitly", async () => {
    mockFetch(json(201, { id: "c1", name: "general" }));
    await send(createSession(), createChannel, {
      payload: { name: "general" },
      options: { headers: { "Content-Type": "application/merge-patch+json" } },
    });
    expect(calls[0].headers.get("Content-Type")).toBe("application/merge-patch+json");
  });

  it("fills and encodes path params", async () => {
    mockFetch(json(200, []));
    await send(createSession(), channelMessages, { payload: { id: "a/b c" } });
    expect(calls[0].url).toBe("https://srv.example/nedis/api/chat/channels/a%2Fb%20c/messages");
  });

  it("rejects a dot-segment path param before any request is made", async () => {
    const fetchMock = mockFetch(json(200, []));
    await expect(send(createSession(), channelMessages, { payload: { id: ".." } })).rejects.toThrow(
      /dot segment/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("send: response", () => {
  it("returns the parsed body", async () => {
    mockFetch(json(201, { id: "c1", name: "general", extra: true }));
    const channel = await send(createSession(), createChannel, { payload: { name: "general" } });
    expect(channel).toEqual({ id: "c1", name: "general" });
  });

  it("throws ContractError when a 2xx body does not match the contract", async () => {
    mockFetch(json(201, { id: 42, name: "general" }));
    await expect(
      send(createSession(), createChannel, { payload: { name: "general" } }),
    ).rejects.toBeInstanceOf(ContractError);
  });

  it("throws HttpError with the status on a non-2xx answer", async () => {
    mockFetch(json(409, { title: "Conflict" }));
    const error = await send(createSession(), createChannel, {
      payload: { name: "general" },
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(409);
  });

  it("handles an empty body (204) without a JSON parse error", async () => {
    mockFetch(empty(204));
    await expect(send(createSession(), listChannels)).resolves.toBeUndefined();
  });

  it("returns a non-JSON body as text instead of failing to parse it", async () => {
    mockFetch(new Response("pong", { status: 200, headers: { "Content-Type": "text/plain" } }));
    await expect(send(createSession(), listChannels)).resolves.toBe("pong");
  });
});

describe("send: auth", () => {
  it("adds the bearer token by default", async () => {
    mockFetch(json(200, []));
    await send(createSession(), listChannels);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer old-token");
  });

  it("does not touch the token provider for auth: 'none'", async () => {
    mockFetch(json(200, {}));
    const session = createSession();
    await send(session, publicEndpoint, { payload: { login: "alice" } });

    expect(session.tokens.getToken).not.toHaveBeenCalled();
    expect(calls[0].headers.has("Authorization")).toBe(false);
  });

  it("on 401 with an empty body refreshes and retries with the NEW token", async () => {
    mockFetch(empty(401), json(200, []));
    const session = createSession();
    await send(session, listChannels);

    expect(session.tokens.refresh).toHaveBeenCalledTimes(1);
    expect(calls.map((c) => c.headers.get("Authorization"))).toEqual([
      "Bearer old-token",
      "Bearer new-token",
    ]);
  });

  it("retries exactly once: a second 401 surfaces as HttpError", async () => {
    mockFetch(empty(401), empty(401));
    const session = createSession();
    const error = await send(session, listChannels).catch((e: unknown) => e);

    expect(calls).toHaveLength(2);
    expect(session.tokens.refresh).toHaveBeenCalledTimes(1);
    expect((error as HttpError).status).toBe(401);
  });

  it("does not retry on 403", async () => {
    mockFetch(empty(403));
    const session = createSession();
    await expect(send(session, listChannels)).rejects.toBeInstanceOf(HttpError);
    expect(session.tokens.refresh).not.toHaveBeenCalled();
  });
});

describe("send: cancellation and timeout", () => {
  it("honours the caller's AbortSignal", async () => {
    mockFetch(json(200, []));
    const controller = new AbortController();
    controller.abort();

    await expect(
      send(createSession(), listChannels, { options: { signal: controller.signal } }),
    ).rejects.toThrow();
    expect(calls[0].signal?.aborted).toBe(true);
  });

  it("gives the retry after 401 its own timeout signal", async () => {
    mockFetch(empty(401), json(200, []));
    await send(createSession(), listChannels);

    expect(calls[0].signal).toBeDefined();
    expect(calls[1].signal).toBeDefined();
    expect(calls[1].signal).not.toBe(calls[0].signal);
  });

  it("aborts a request that outlives the endpoint timeout", async () => {
    const slow = createEndpoint({
      method: "GET",
      path: "api/slow",
      timeoutMs: 20,
      parseResponse: (raw) => raw,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: URL | RequestInfo, init?: RequestInit) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          }),
      ),
    );

    await expect(send(createSession(), slow)).rejects.toMatchObject({ name: "TimeoutError" });
  });
});

describe("send: types", () => {
  it("infers the payload and result types from the endpoint", () => {
    const typecheckOnly = () => {
      const session = createSession();

      expectTypeOf(
        send(session, createChannel, { payload: { name: "general" } }),
      ).resolves.toEqualTypeOf<{ readonly id: string; readonly name: string }>();

      // @ts-expect-error: payload of the wrong shape
      void send(session, createChannel, { payload: { name: 42 } });
      // @ts-expect-error: payload is required for an endpoint with a body
      void send(session, createChannel);
      // no payload needed for an endpoint without body and path params
      void send(session, listChannels);
    };
    void typecheckOnly;
  });
});
