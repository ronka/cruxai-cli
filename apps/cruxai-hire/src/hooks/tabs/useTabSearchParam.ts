import { useQueryState, parseAsString } from "nuqs";

export function useTabSearchParam(defaultValue: string) {
  return useQueryState(
    "tab",
    parseAsString.withDefault(defaultValue).withOptions({ history: "push" }),
  );
}
