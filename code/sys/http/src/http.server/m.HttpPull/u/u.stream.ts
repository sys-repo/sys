import { Is, type t } from '../common.ts';
import { execute } from './u.execute.ts';

/** Start one pull operation; terminal records are input-ordered, events are not. */
export function stream(
  resources: readonly t.HttpPull.Resource[],
  rooted: t.Fs.Rooted.Instance,
  options: t.HttpPull.ResourceOptions,
): t.HttpPull.Stream.Instance;
export function stream(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPull.Options,
): t.HttpPull.Stream.Instance;
export function stream(
  input: readonly t.HttpPull.Resource[] | readonly string[],
  destination: t.Fs.Rooted.Instance | t.StringDir,
  options: t.HttpPull.ResourceOptions | t.HttpPull.Options,
): t.HttpPull.Stream.Instance {
  return Is.str(destination)
    ? execute(input as readonly string[], destination, options as t.HttpPull.Options)
    : execute(
      input as readonly t.HttpPull.Resource[],
      destination,
      options as t.HttpPull.ResourceOptions,
    );
}
