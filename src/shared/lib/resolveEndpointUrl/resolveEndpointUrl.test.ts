import { describe, expect, it } from "vitest";
import { resolveEndpointUrl } from "./resolveEndpointUrl";

const rootServer = { href: "https://srv.example/" };
const prefixedServer = { href: "https://srv.example/nedis/" };

describe("resolveEndpointUrl", () => {
  it("resolves a path against a server at the origin root", () => {
    expect(resolveEndpointUrl(rootServer, "api/chat/channels").href).toBe(
      "https://srv.example/api/chat/channels",
    );
  });

  it("resolves a path against a server mounted under a prefix", () => {
    expect(resolveEndpointUrl(prefixedServer, "api/chat/channels").href).toBe(
      "https://srv.example/nedis/api/chat/channels",
    );
  });

  it("treats leading slashes as relative to the prefix, not to the origin", () => {
    expect(resolveEndpointUrl(prefixedServer, "/api/auth/login").pathname).toBe(
      "/nedis/api/auth/login",
    );
    expect(resolveEndpointUrl(prefixedServer, "//api/auth/login").pathname).toBe(
      "/nedis/api/auth/login",
    );
  });

  it("works the same when href has no trailing slash", () => {
    expect(resolveEndpointUrl({ href: "https://srv.example/nedis" }, "api/x").pathname).toBe(
      "/nedis/api/x",
    );
  });

  it("rejects an absolute URL to another origin", () => {
    expect(() => resolveEndpointUrl(prefixedServer, "https://evil.example/steal")).toThrow(
      /leaves boundaries/,
    );
  });

  it("rejects climbing above the prefix", () => {
    expect(() => resolveEndpointUrl(prefixedServer, "../admin")).toThrow(/leaves boundaries/);
  });

  it("rejects a sibling prefix that only starts with the same letters", () => {
    expect(() =>
      resolveEndpointUrl({ href: "https://srv.example/nedis" }, "../nedis-evil/x"),
    ).toThrow(/leaves boundaries/);
  });
});
