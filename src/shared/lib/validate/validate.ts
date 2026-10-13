import { doesNotExistInUnion, invalidType } from "./contractErrorDetails";
import { ContractError } from "./ContractError";
import type {
  Infer,
  InferObject,
  ObjectShape,
  OptionalParser,
  Parser,
  PrimitiveName,
  Shape,
  VariableTypes,
} from "./types";
import type { ContractIssue } from "./ContractError.types";

//TODO: try to reimplement parsing iteratively rather than recusively.
//TODO: need to fix typing. Preferably, squash all type casts.

function fail(path: string, expected: VariableTypes, raw: unknown): never {
  throw new ContractError([{ path, message: invalidType(raw, expected) }]);
}

const PRIMITIVES: { readonly [K in PrimitiveName]: Parser<unknown> } = {
  string: (raw, path = "") => (typeof raw === "string" ? raw : fail(path, "string", raw)),
  number: (raw, path = "") =>
    typeof raw === "number" && Number.isFinite(raw) ? raw : fail(path, "number", raw),
  boolean: (raw, path = "") => (typeof raw === "boolean" ? raw : fail(path, "boolean", raw)),
  timestamp: (raw, path = "") => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const parsed = Date.parse(typeof raw === "string" ? raw : "");
    return Number.isNaN(parsed) ? fail(path, "timestamp", raw) : parsed;
  },
};

function collect<T>(entries: readonly (readonly [string, () => T])[]): {
  values: T[];
  issues: ContractIssue[];
} {
  const values: T[] = [];
  const issues: ContractIssue[] = [];
  for (const [, read] of entries) {
    try {
      values.push(read());
    } catch (e) {
      if (!(e instanceof ContractError)) throw e;
      issues.push(...e.issues);
    }
  }
  return { values, issues };
}

function arrayParser(item: Parser<unknown>): Parser<unknown[]> {
  return (raw, path = "") => {
    if (!Array.isArray(raw)) fail(path, "array", raw);

    const entriesToParse = raw.map((entry, index) => {
      const entryPath = `${path}[${index}]`;
      return [entryPath, () => item(entry, entryPath)] as const;
    });

    const { values, issues } = collect(entriesToParse);
    if (issues.length > 0) throw new ContractError(issues);
    return values;
  };
}

function objectParser(shape: ObjectShape): Parser<Readonly<Record<string, unknown>>> {
  const fields = Object.entries(shape).map(
    ([entryKey, entryShape]) => [entryKey, toParser(entryShape)] as const,
  );

  return (raw, path = "") => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail(path, "object", raw);
    const source = raw as Readonly<Record<string, unknown>>;
    const result = {} as Record<string, unknown>;

    const { issues } = collect(
      fields.map(([entryKey, parser]) => [
        path,
        () => {
          const value = parser(source[entryKey], path === "" ? entryKey : `${path}.${entryKey}`);
          if (value !== undefined) result[entryKey] = value;
          // potentially unnecessary memory allocation
          return value;
        },
      ]),
    );
    if (issues.length > 0) throw new ContractError(issues);
    return result;
  };
}

function toParser(shape: Shape): Parser<unknown> {
  if (typeof shape === "string") return PRIMITIVES[shape];
  if (typeof shape === "function") return shape;
  if (Array.isArray(shape)) return arrayParser(toParser(shape[0] as Shape));
  return objectParser(shape as ObjectShape);
}

function objectOf<const S extends ObjectShape>(shape: S, where: string): Parser<InferObject<S>> {
  const parser = objectParser(shape);
  return (raw, path = where) => parser(raw, path) as InferObject<S>;
}

function parseShape<const S extends ObjectShape>(
  raw: unknown,
  shape: S,
  where: string,
): InferObject<S> {
  return objectOf(shape, where)(raw);
}

function optional<const S extends Shape>(shape: S): OptionalParser<Infer<S>> {
  const inner = toParser(shape);
  const parser: Parser<Infer<S> | undefined> = (raw, where = "") =>
    raw === undefined || raw === null ? undefined : (inner(raw, where) as Infer<S>);

  return parser as OptionalParser<Infer<S>>;
}

function arrayOf<const S extends Shape>(shape: S): Parser<Infer<S>[]> {
  return arrayParser(toParser(shape)) as Parser<Infer<S>[]>;
}

function oneOf<const T extends readonly string[]>(values: T): Parser<T[number]> {
  return (raw, path = "") => {
    const value = PRIMITIVES.string(raw, path) as string;
    if (!values.includes(value)) {
      throw new ContractError([{ path, message: doesNotExistInUnion(value, values) }]);
    }
    return value as T[number];
  };
}

function knownOf<const T extends readonly string[]>(values: T): Parser<T[number][]> {
  const items = arrayOf("string");
  return (raw, path = "") => items(raw, path).filter((key) => values.includes(key));
}

function knownSetOf<const T extends readonly string[]>(values: T): Parser<ReadonlySet<T[number]>> {
  const known = knownOf(values);
  return (raw, path = "") => new Set(known(raw, path));
}

function mapped<S extends Shape, T>(shape: S, map: (value: Infer<S>) => T): Parser<T> {
  const inner = toParser(shape);
  return (raw, path = "") => {
    const value = inner(raw, path) as Infer<S>;
    try {
      return map(value);
    } catch (error) {
      throw new ContractError([
        { path, message: error instanceof Error ? error.message : "value has been rejected" },
      ]);
    }
  };
}

export { objectOf, arrayOf, knownOf, knownSetOf, optional, mapped, parseShape, oneOf };
