import { Await, HttpClient, Is, Rx, type t } from './common.ts';
import { pullOne } from './u.pullOne.ts';
import { preflightResources, pullResource } from './u.resource.ts';

export function toDir(
  resources: readonly t.HttpPull.Resource[],
  rooted: t.Fs.Rooted.Instance,
  options: t.HttpPull.ResourceOptions,
): Promise<t.HttpPull.ToDir.Result>;
export function toDir(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPull.Options,
): Promise<t.HttpPull.ToDir.Result>;
export function toDir(
  input: readonly t.HttpPull.Resource[] | readonly string[],
  destination: t.Fs.Rooted.Instance | t.StringDir,
  options: t.HttpPull.ResourceOptions | t.HttpPull.Options,
): Promise<t.HttpPull.ToDir.Result> {
  return Is.str(destination)
    ? pullUrls(input as readonly string[], destination, options as t.HttpPull.Options)
    : pullResources(
      input as readonly t.HttpPull.Resource[],
      destination,
      options as t.HttpPull.ResourceOptions,
    );
}

async function pullUrls(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPull.Options,
): Promise<t.HttpPull.ToDir.Result> {
  const { map, retry } = options;
  const ownsClient = !options.client;
  const client = options.client ?? HttpClient.fetcher({
    policy: options.policy,
    until: options.until,
  });
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const limit = Await.semaphore(concurrency);

  try {
    const tasks = urls.map((url) => limit(() => pullOne(url, dir, client, { map, retry })));
    const ops = await Promise.all(tasks);
    const ok = ops.every((op) => op.ok);
    return { ok, ops } as t.HttpPull.ToDir.Result;
  } finally {
    if (ownsClient) client.dispose();
  }
}

async function pullResources(
  resources: readonly t.HttpPull.Resource[],
  rooted: t.Fs.Rooted.Instance,
  options: t.HttpPull.ResourceOptions,
): Promise<t.HttpPull.ToDir.Result> {
  const life = Rx.abortable(options.until);

  try {
    const preflight = await preflightResources(resources, rooted, life.signal);
    if (!preflight.ok) return { ok: false, ops: preflight.records };

    const client = HttpClient.fetcher({
      policy: options.policy,
      until: life.signal,
    });
    try {
      const ops: t.HttpPull.Record[] = [];
      for (const resource of preflight.resources) {
        ops.push(await pullResource(resource, rooted, client, { signal: life.signal }));
      }
      const ok = ops.every((op) => op.ok);
      return { ok, ops } as t.HttpPull.ToDir.Result;
    } finally {
      client.dispose();
    }
  } finally {
    life.dispose();
  }
}
