type PlainObjectLike = Record<PropertyKey, unknown>;

export type Writeable<T> = T extends PlainObjectLike | readonly unknown[]
  ? { -readonly [P in keyof T]: T[P] }
  : T;
