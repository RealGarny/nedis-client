function getRuntimeType(value: any) {
  return typeof value;
}

type VariableTypes = ReturnType<typeof getRuntimeType>;

export type { VariableTypes };
