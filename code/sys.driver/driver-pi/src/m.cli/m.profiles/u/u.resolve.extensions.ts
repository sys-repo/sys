import { lstat } from '@sys/fs/observe';
import type { t } from '../common.ts';
import { Ocr } from '../../../m.core/m.extension/m.ocr/mod.ts';
import { SandboxFs } from '../../../m.core/m.extension/m.sandbox.fs/mod.ts';
import { Zip } from '../../../m.core/m.extension/m.zip/mod.ts';

export type ResolveExtensionsInput = {
  cwd: t.StringDir;
  enabled: boolean;
  sandboxFs: t.PiSandboxFsExtension.Policy;
  zip?: t.PiCliProfiles.Tools.Zip;
  ocr?: t.PiOcrExtension.Extension.PolicyInput;
};

/**
 * Materialize enabled extensions before deriving any loader or advertisement output.
 */
export async function resolveExtensions(input: ResolveExtensionsInput) {
  if (!input.enabled) return { args: [], promptArgs: [], tools: [] };

  const { cwd, sandboxFs, ocr } = input;
  const filesystem = SandboxFs.toolNames(sandboxFs).length > 0
    ? await SandboxFs.write({ cwd, policy: sandboxFs })
    : undefined;
  const ocrExtension = ocr
    ? await Ocr.write({ cwd, policy: Ocr.resolveExtensionPolicy(ocr) })
    : undefined;
  const zipPolicy = input.zip?.enabled !== false
    ? await Zip.resolvePolicy({
      enabled: input.zip?.enabled,
      readRoots: await zipReadRoots(sandboxFs.readRoots),
      protectedRoots: [...sandboxFs.protectedRoots],
    })
    : undefined;
  const zipExtension = zipPolicy ? await Zip.write({ cwd, policy: zipPolicy }) : undefined;

  return {
    args: [
      ...(filesystem?.args ?? []),
      ...(ocrExtension?.args ?? []),
      ...(zipExtension?.args ?? []),
    ],
    promptArgs: [
      ...(filesystem ? SandboxFs.toPromptArgs(sandboxFs) : []),
      ...(ocrExtension && ocr ? Ocr.toPromptArgs(ocr.policy) : []),
      ...(zipExtension && zipPolicy ? Zip.toPromptArgs(zipPolicy) : []),
    ],
    tools: [
      ...(filesystem ? SandboxFs.toolNames(sandboxFs) : []),
      ...(ocrExtension && ocr ? Ocr.toolNames(ocr.policy) : []),
      ...(zipExtension && zipPolicy ? Zip.toolNames(zipPolicy) : []),
    ],
  };
}

/** Preserve directory and absent roots without broadening exact file grants to their parents. */
async function zipReadRoots(roots: readonly t.StringPath[]) {
  const next: t.StringPath[] = [];
  for (const path of roots) {
    try {
      const info = await lstat(path);
      if (!info || (info.isDirectory && !info.isSymlink)) next.push(path);
    } catch {
      // Preserve inspection failures so the ZIP policy owner reports them consistently.
      next.push(path);
    }
  }
  return next;
}
