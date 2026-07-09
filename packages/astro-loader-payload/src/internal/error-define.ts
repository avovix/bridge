import type { PayloadErrorDefinition } from "../types";

export function defineError<
  const TCode extends string,
  const TName extends string,
  const TArgs extends readonly unknown[],
>(def: PayloadErrorDefinition<TCode, TName, TArgs>): PayloadErrorDefinition<TCode, TName, TArgs> {
  return def;
}
