declare module "text-diff" {
  type DiffTuple = [number, string];

  class Diff {
    constructor(options?: { timeout?: number; editCost?: number });
    main(text1: string, text2: string): DiffTuple[];
    cleanupSemantic(diffs: DiffTuple[]): void;
    cleanupEfficiency(diffs: DiffTuple[]): void;
    levenshtein(diffs: DiffTuple[]): number;
    prettyHtml(diffs: DiffTuple[]): string;
  }

  export = Diff;
}

