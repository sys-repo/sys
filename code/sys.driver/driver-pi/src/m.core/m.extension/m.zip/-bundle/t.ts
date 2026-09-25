export type Kind = 'read' | 'extract';
export type Mode = 'write' | 'check';

/**
 * Prepared standalone extension bytes and their digest.
 */
export type Artifact = {
  readonly bundleHash: string;
  readonly text: string;
};
