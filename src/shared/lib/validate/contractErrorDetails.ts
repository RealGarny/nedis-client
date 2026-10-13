import type { VariableTypes } from "./types";

function invalidType(raw: unknown, expected: VariableTypes) {
  return `expeted to recieve ${expected}, but got ${typeof raw} instead.`;
}

function doesNotExistInUnion(value: string, union: readonly string[]) {
  return `"${value}" does not exist is union "${union.join(", ")}"`;
}

export { invalidType, doesNotExistInUnion };
