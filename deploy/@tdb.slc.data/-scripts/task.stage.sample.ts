import { SlcDataPipeline } from '@tdb/slc-data/fs';
import { Fs } from '@sys/fs';

/**
 * WARNING:
 * Temporary local fixture source for sample staging.
 * TODO: derive this from repo config/env so the task does not depend on a machine-local absolute path.
 */
const source = `/Users/phil/code/org.tdb/slc-knowledgebase/docs/slc-knowledge/agent-content/venture-example-libraries`;
const target = './.tmp/staging.sample-1';
const exists = (name: string, dir = 'manifests') => Fs.exists(Fs.join(target, dir, name));
const ensure = async (name: string, dir = 'manifests') => {
  if (!(await exists(name, dir))) throw new Error(`missing ${name}`);
};

const result = await SlcDataPipeline.stageFolder({ source, target });
await ensure('slug-tree.venture-example-libraries.json');
await ensure('slug-tree.venture-example-libraries.yaml');
await ensure('slug-tree.venture-example-libraries.assets.json');
console.info(result);
