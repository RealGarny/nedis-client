import { fillPath } from "./fillPath";

describe("fillPath", () => {
  it("returns a template without params unchanged", () => {
    expect(fillPath("api/chat/channels", undefined)).toBe("api/chat/channels");
  });

  it("substitutes every param", () => {
    expect(fillPath("api/servers/{server}/channels/{id}", { server: "s1", id: "c1" })).toBe(
      "api/servers/s1/channels/c1",
    );
  });

  it("encodes values, including slashes, so a value stays one path segment", () => {
    expect(fillPath("api/channels/{id}", { id: "a/b?c#d e" })).toBe(
      "api/channels/a%2Fb%3Fc%23d%20e",
    );
  });

  it("throws when a param is missing", () => {
    expect(() => fillPath("api/channels/{id}", {})).toThrow(/Param "id" is not set/);
  });

  it.each([".", "..", ""])("rejects %j: it would collapse into another endpoint", (value) => {
    expect(() => fillPath("api/channels/{id}/messages", { id: value })).toThrow(
      /empty or a dot segment/,
    );
  });

  it("accepts values that merely contain dots", () => {
    expect(fillPath("api/files/{name}", { name: "a..b.txt" })).toBe("api/files/a..b.txt");
  });
});
