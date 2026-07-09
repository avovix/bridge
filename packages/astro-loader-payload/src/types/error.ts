import type { PayloadErrors } from "../data/errors-data"

export type PayloadErrorDefinition<
  TCode extends string = string,
  TName extends string = string,
  TArgs extends readonly unknown[] = readonly unknown[],
> = {
  code: TCode;
  name: TName;
  message: (...args: TArgs) => string;
  hint?: string;
};

export type PayloadErrorCode = typeof PayloadErrors[keyof typeof PayloadErrors]["code"];
export type PayloadErrorName = typeof PayloadErrors[keyof typeof PayloadErrors]["name"];
