//Expands the intersection into a single object. otherwise, IDE tooltips are unreadable.
type PrettifyObject<T> = { [K in keyof T]: T[K] } & {};

export type { PrettifyObject };
