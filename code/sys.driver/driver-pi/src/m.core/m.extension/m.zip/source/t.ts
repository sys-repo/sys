import type {
  AgentToolResult,
  ExtensionAPI,
  withFileMutationQueue,
} from '@earendil-works/pi-coding-agent';
import type { t } from '../common.ts';

export type { FsRooted, Zip } from '../../../../common/t.ts';

/** Internal contracts shared by the generated ZIP entries. */
export type Host = Pick<ExtensionAPI, 'registerTool'>;
export type MutationQueue = typeof withFileMutationQueue;
export type Policy = t.PiZipExtension.Policy;
export type ToolName = t.PiZipExtension.ToolName;
export type Result<T> = AgentToolResult<T>;
export type Archive = t.Zip.Archive;
export type Inspection = t.Zip.Inspection;
export type Entry = t.Zip.Entry;
export type SnapshotResult = t.Snapshot.File.Result;

export type Source = {
  readonly requested: string;
  readonly resolved: string;
  readonly root: string;
};

export type Operation = {
  readonly name: ToolName;
  readonly deadline: number;
  readonly signal?: AbortSignal;
};

export type InspectDetails = Inspection & {
  readonly kind: 'zip-inspection';
  readonly path: string;
  readonly resolved: string;
  readonly evidence: SnapshotResult['evidence'];
  readonly displayTruncated: boolean;
};

export type TestDetails = {
  readonly kind: 'zip-integrity';
  readonly path: string;
  readonly resolved: string;
  readonly evidence: SnapshotResult['evidence'];
  readonly format: 'zip32';
  readonly sourceBytes: number;
  readonly filesTested: number;
  readonly compressedBytes: number;
  readonly expandedBytes: number;
};

export type ExtractUpdate = (result: Result<{ readonly kind: 'zip-extraction-waiting' }>) => void;

export type ExtractDetails = {
  readonly kind: 'zip-extraction';
  readonly path: string;
  readonly resolved: string;
  readonly to: string;
  readonly destination: string;
  readonly evidence: SnapshotResult['evidence'];
  readonly extraction: t.Zip.ExtractResult;
  readonly publication: 'published';
  readonly cleanup: 'complete';
};
