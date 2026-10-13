import { describe, expect, expectTypeOf, it } from "vitest";
import { ContractError } from "./ContractError";
import { arrayOf, knownSetOf, mapped, objectOf, oneOf, optional, parseShape } from "./validate";
import { doesNotExistInUnion, invalidType } from "./contractErrorDetails";

const parseUser = objectOf(
  {
    id: "string",
    createdAt: "timestamp",
    nickname: optional("string"),
    roles: [oneOf(["admin", "member"])],
    profile: { theme: "string", compact: "boolean" },
  },
  "User",
);

describe("objectOf", () => {
  it("parses nested objects, arrays, and dates", () => {
    const user = parseUser({
      id: "u1",
      createdAt: "2026-01-02T03:04:05.000Z",
      roles: ["admin", "member"],
      profile: { theme: "dark", compact: true },
      unknownField: "сервер новее клиента", // excess fields are being ignored
    });

    expect(user).toEqual({
      id: "u1",
      createdAt: Date.parse("2026-01-02T03:04:05.000Z"),
      roles: ["admin", "member"],
      profile: { theme: "dark", compact: true },
    });
  });

  it("infers the result type, including optional fields", () => {
    const typecheckOnly = () => {
      expectTypeOf(parseUser({})).toEqualTypeOf<{
        readonly id: string;
        readonly createdAt: number;
        readonly roles: ("admin" | "member")[];
        readonly profile: { readonly theme: string; readonly compact: boolean };
        readonly nickname?: string | undefined;
      }>();
    };
    void typecheckOnly;
  });

  it("collects all errors at once, including paths to the fields", () => {
    const error = (() => {
      try {
        parseUser({
          id: 42,
          createdAt: "вчера",
          roles: ["admin", "root"],
          profile: { theme: "dark" },
        });
      } catch (e) {
        return e as ContractError;
      }
      return undefined;
    })();

    expect(error).toBeInstanceOf(ContractError);
    expect(error?.issues.map((i) => i.path)).toEqual([
      "User.id",
      "User.createdAt",
      "User.roles[1]",
      "User.profile.compact",
    ]);
  });

  it("It doesn't write the field value into the error message", () => {
    const objectToParse = { accessToken: "secret-jwt" };
    const expectedType = "number";

    const parse = objectOf({ accessToken: expectedType }, "AuthResponse");
    const error = (() => {
      try {
        parse(objectToParse);
      } catch (e) {
        return e as ContractError;
      }
      return undefined;
    })();

    expect(error?.message).toBe(
      `AuthResponse.accessToken: ${invalidType(objectToParse.accessToken, expectedType)}`,
    );
    expect(error?.message).not.toContain("secret-jwt");
  });

  it("distinguishes a missing optional field from an invalid one", () => {
    const parse = objectOf({ topic: optional("string") }, "Channel");
    expect(parse({})).toEqual({});
    expect(parse({ topic: null })).toEqual({});
    expect(() => parse({ topic: 5 })).toThrow(/Channel.topic/);
  });
});

describe("combinators", () => {
  it("knownSetOf discards unknown values, whereas oneOf does not.", () => {
    const features = knownSetOf(["voice", "search"]);
    expect([...features(["search", "someOtherGreatFeature"], "f")]).toEqual(["search"]);
    const union = ["local"];
    const incorrectKey = "oauth";
    expect(() => oneOf(union)(incorrectKey, "m")).toThrow(
      "m: " + doesNotExistInUnion(incorrectKey, union),
    );
  });

  it("mapped applies the ready-made normalization and catches any errors it produces.", () => {
    const error = "port is invalid";
    const port = mapped("string", (value) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) throw new Error(error);
      return parsed;
    });
    expect(port("5432", "p")).toBe(5432);
    expect(() => port("абв", "p")).toThrow(error);
  });

  it("arrayOf and parseShape work without setting up a parser.", () => {
    expect(arrayOf("number")([1, 2], "xs")).toEqual([1, 2]);
    expect(
      parseShape({ hello: true, test: "ok" }, { hello: "boolean", test: "string" }, "Panorama"),
    ).toEqual({
      hello: true,
      test: "ok",
    });
  });
});
