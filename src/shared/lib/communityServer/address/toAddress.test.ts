import { describe, expect, it } from "vitest";
import { toAddress } from "./toAddress";

describe("toAddress", () => {
  it("defaults to https and adds the trailing slash to the mount point", () => {
    expect(toAddress("chat.example.org")).toEqual({
      origin: "https://chat.example.org",
      href: "https://chat.example.org/",
    });
  });

  it("keeps a path prefix as the mount point", () => {
    expect(toAddress("https://chat.example.org/nedis")).toEqual({
      origin: "https://chat.example.org",
      href: "https://chat.example.org/nedis/",
    });
  });

  it("derives origin and href from the same URL, so href always starts with origin", () => {
    const address = toAddress("https://chat.example.org:8443/a/b/");
    expect(address.origin).toBe("https://chat.example.org:8443");
    expect(address.href.startsWith(`${address.origin}/`)).toBe(true);
  });

  it("drops query and fragment: a mount point is a path, not a page", () => {
    expect(toAddress("https://chat.example.org/nedis/?invite=x#top").href).toBe(
      "https://chat.example.org/nedis/",
    );
  });

  it("rejects schemes other than https (and http in dev)", () => {
    expect(() => toAddress("ftp://chat.example.org")).toThrow(/Insecure server URL/);
  });
});
