import { Is, type t } from '../common.ts';
import { stream } from './u.stream.ts';

/** Project the shared pull operation to its terminal result; this owns no execution path. */
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
    ? stream(input as readonly string[], destination, options as t.HttpPull.Options).done
    : stream(
      input as readonly t.HttpPull.Resource[],
      destination,
      options as t.HttpPull.ResourceOptions,
    ).done;
}
