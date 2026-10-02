declare const brand: unique symbol;
type Brand<T, TName extends string> = T & { readonly [brand]: TName };

export type { Brand };
