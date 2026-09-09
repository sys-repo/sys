import { lstat } from '@sys/fs/observe';
import type { t } from '../common.ts';
import { Ocr } from '../../../m.core/m.extension/m.ocr/mod.ts';
import { Sandbox } from '../../../m.core/m.extension/m.sandbox/mod.ts';
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
  const filesystem = Sandbox.Fs.toolNames(sandboxFs).length > 0
    ? await Sandbox.Fs.write({ cwd, policy: sandboxFs })
    : undefined;
  const ocrExtension = ocr
    ? await Ocr.write({ cwd, policy: Ocr.resolveExtensionPolicy(ocr) })
    : undefined;
  const zipPolicy = input.zip?.enabled !== false
    ? await Zip.resolvePolicy({
      enabled: input.zip?.enabled,
      extract: input.zip?.extract,
      readRoots: await zipDirectoryRoots(sandboxFs.readRoots),
      writeRoots: input.zip?.extract ? await zipDirectoryRoots(sandboxFs.writeRoots) : [],
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
      ...(filesystem ? Sandbox.Fs.toPromptArgs(sandboxFs) : []),
      ...(ocrExtension && ocr ? Ocr.toPromptArgs(ocr.policy) : []),
      ...(zipExtension && zipPolicy ? Zip.toPromptArgs(zipPolicy) : []),
    ],
    tools: [
      ...(filesystem ? Sandbox.Fs.toolNames(sandboxFs) : []),
      ...(ocrExtension && ocr ? Ocr.toolNames(ocr.policy) : []),
      ...(zipExtension && zipPolicy ? Zip.toolNames(zipPolicy) : []),
    ],
  };
}

/** Preserve directory and absent roots without broadening exact file grants to their parents. */
async function zipDirectoryRoots(roots: readonly t.StringPath[]) {
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
