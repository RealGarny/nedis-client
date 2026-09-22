//TODO: need to rewrite types in the future.
//Right now, they are pretty unsafe and don't use any generics.

import type { PrettifyObject } from "@/shared/types/prettifyObject";

type Parser<T> = (raw: unknown, path?: string) => T;
type OptionalParser<T> = Parser<T | undefined>;

interface Primitives {
  string: string;
  number: number;
  boolean: boolean;
  timestamp: number;
}
type PrimitiveName = keyof Primitives;
type VariableTypes = PrimitiveName | "array" | "object";

type ObjectShape = { readonly [key: string]: Shape };

type Shape = PrimitiveName | Parser<unknown> | readonly [Shape] | ObjectShape;

type OptionalKeys<S> = {
  [K in keyof S]: S[K] extends OptionalParser<unknown> ? K : never;
}[keyof S];

export type InferObject<S extends ObjectShape> = PrettifyObject<
  { readonly [K in Exclude<keyof S, OptionalKeys<S>>]: Infer<S[K]> } & {
    readonly [K in OptionalKeys<S>]?: Infer<S[K]>;
  }
>;

type Infer<S> = S extends PrimitiveName
  ? Primitives[S]
  : S extends OptionalParser<infer T>
    ? T | undefined
    : S extends Parser<infer T>
      ? T
      : S extends readonly [infer Item]
        ? Infer<Item>[]
        : S extends ObjectShape
          ? InferObject<S>
          : never;

export type {
  PrimitiveName,
  Infer,
  Parser,
  Shape,
  ObjectShape,
  Primitives,
  VariableTypes,
  OptionalParser,
};
