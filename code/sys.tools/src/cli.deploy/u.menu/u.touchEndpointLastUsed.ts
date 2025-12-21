import { type t, Time } from '../common.ts';

/**
 * Update lastUsedAt for an endpoint ref and persist config.
 */
export async function touchEndpointLastUsed(args: {
  readonly config: t.DeployTool.Config.File;
  readonly endpointName: string;
}): Promise<void> {
  const { config, endpointName } = args;

  config.change((doc) => {
    const now = Time.now.timestamp;
    const current = doc.endpoints ?? [];
    doc.endpoints = current.map((e) => (e.name === endpointName ? { ...e, lastUsedAt: now } : e));
  });

  await config.fs.save();
}
