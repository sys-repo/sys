import { type t, Yaml } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';

type EnvAstResolver = typeof YamlConfig.Env.resolveAst;

/** Resolve endpoint env refs only when pure AST inspection finds a valid reference. */
export async function resolveEndpointEnvRefs(
  ast: t.Yaml.Ast,
  options: {
    cwd: t.StringDir;
    resolve?: EnvAstResolver;
  },
): Promise<t.Yaml.EnvRef.Resolve.Result> {
  const inspected = Yaml.EnvRef.inspectAst(ast);
  if (!inspected.ok || inspected.refs.length === 0) return inspected;

  const resolve = options.resolve ?? YamlConfig.Env.resolveAst;
  return await resolve(ast, { cwd: options.cwd, search: 'upward' });
}
