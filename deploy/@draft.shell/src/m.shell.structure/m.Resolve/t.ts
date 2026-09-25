/** Resolve/default a parsed Shell.Structure value. */
export declare namespace Resolve {
  export type Fn<Structure, Resolved = Structure> = (structure: Structure) => Resolved;
}
