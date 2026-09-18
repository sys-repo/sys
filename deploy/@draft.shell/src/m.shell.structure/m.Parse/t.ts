/** Parse raw input into a Shell.Structure value. */
export declare namespace Parse {
  /** Raw parse input accepted by ShellStructure.parse; strings are parsed as YAML. */
  export type Input = unknown;

  /** Parse raw input into a typed Shell.Structure value. */
  export type Fn<Structure> = (input: Input) => Structure;
}
