import artifact from './artifact.extract.json' with { type: 'json' };
import { admitZipArtifact } from './artifact.ts';

/** Prep-generated extraction bytes; separate from read-only materialization. */
export const zipExtractBundle = admitZipArtifact(artifact, 'extract');
