import type { AgentToolResult, ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { t } from '../common.ts';

/**
 * Internal contracts for the generated read-only ZIP runtime.
 */
export declare namespace ZipRead {
  export type Host = Pick<ExtensionAPI, 'registerTool'>;
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
}
