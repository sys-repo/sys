/** Parse raw input into a Shell.Structure document. */
export declare namespace Parse {
  /** Raw parse input accepted by Shell.Structure.parse. */
  export type Input = string | unknown;

  /** Parse raw input into a typed document. */
  export type Fn<Document> = (input: Input) => Document;
}
