import { type t, c } from '../common.ts';
import { makeParser } from '../u.parser.ts';
import { lintAliases } from './u.lint.aliases.ts';
import { extractSequence } from '../extractSequence.ts';

export async function lint(dag: t.Graph.Dag.Result, yamlPath: t.ObjectPath) {
  const Parse = makeParser(yamlPath);
  let total = { docs: 0, issues: 0 };

  /**
   * Check aliases
   */
  for (const node of dag.nodes) {
    const slug = Parse.findParsedNode(dag, node.id);
    const alias = slug?.alias;
    if (!alias) continue;

    const lint = lintAliases(alias.resolver.alias);
    if (lint.length > 0) {
      console.info(c.yellow('   Problem'), node.id);
    }

    total.docs += 1;
    total.issues += lint.length;
  }

  const white = (total: number) => c.white(String(total));
  console.info();
  const summary = c.gray(`  ${white(total.docs)} documents with ${white(total.issues)} problems`);
  console.info(c.italic(summary));

  /**
   * Check file paths
   */
  for (const node of dag.nodes) {
    await extractSequence(dag, yamlPath, node.id);
  }

  /**
   * Finish up.
   */
  const ok = total.issues === 0;
  return { ok, total: { issues: total.issues } } as const;
}
