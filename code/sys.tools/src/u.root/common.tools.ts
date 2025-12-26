/**
 * Aggregated runtime tool IDs.
 *
 * Centralizes imports of per-tool `ID` constants so command lists,
 * guards, and dispatch logic share a single, drift-free source.
 */
import { ClipboardTool } from '../cli.clipboard/t.namespace.ts';
import { CrdtTool } from '../cli.crdt/t.namespace.ts';
import { DeployTool } from '../cli.deploy/t.namespace.ts';
import { FsTool } from '../cli.fs/t.namespace.ts';
import { ServeTool } from '../cli.serve/t.namespace.ts';
import { UpdateTool } from '../cli.update/t.namespace.ts';
import { VideoTool } from '../cli.video/t.namespace.ts';

export const TOOL_IDS = [
  ClipboardTool.ID,
  CrdtTool.ID,
  DeployTool.ID,
  FsTool.ID,
  ServeTool.ID,
  UpdateTool.ID,
  VideoTool.ID,
] as const;
