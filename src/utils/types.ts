type PlainObjectLike = Record<PropertyKey, unknown>;

export type NonReadOnly<T> = T extends PlainObjectLike | readonly unknown[]
  ? { -readonly [P in keyof T]: T[P] }
  : T;

export type Awaitable<T> = Promise<T> | T;
