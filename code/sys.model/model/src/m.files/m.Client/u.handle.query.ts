import { type t } from '../common.ts';
import { Cmd } from '../m.Cmd.ts';

type QueryMethods = Pick<
  t.Files.Client.Handle,
  'capabilities' | 'list' | 'stat' | 'manifest' | 'watch'
>;

/**
 * Create query-oriented Files client handle methods.
 */
export function createQueryMethods(cmd: t.Files.Cmd.Client): QueryMethods {
  const capabilities: t.Files.Client.Handle['capabilities'] = () => {
    return cmd.send(Cmd.Name.capabilities, {});
  };

  const list: t.Files.Client.Handle['list'] = (input = {}) => {
    return cmd.send(Cmd.Name.list, input);
  };

  const stat: t.Files.Client.Handle['stat'] = async (path) => {
    const result = await cmd.send(Cmd.Name.stat, { path });
    return result.entry;
  };

  function manifest(): Promise<t.Files.Manifest>;
  function manifest(
    options: t.Files.Client.ManifestWithContentRefsOptions,
  ): Promise<t.Files.Client.ManifestWithContentRefs>;
  function manifest(options?: t.Files.Client.ManifestOptions): Promise<t.Files.Manifest> {
    return cmd.send(Cmd.Name.manifest, options ?? {});
  }

  const watch: t.Files.Client.Handle['watch'] = (input = {}) => {
    return cmd.stream(Cmd.Name.watch, input);
  };

  return { capabilities, list, stat, manifest, watch };
}
