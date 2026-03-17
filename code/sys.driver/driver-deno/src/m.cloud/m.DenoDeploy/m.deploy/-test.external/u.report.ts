import { DenoDeploy } from '../../mod.ts';
import { c } from './common.ts';

type DeployResult = Extract<Awaited<ReturnType<typeof DenoDeploy.deploy>>, { ok: true }>;

export function printDeployResult(result: DeployResult, label = 'external staged result') {
  const { ok, code, deploy } = result;
  console.info(`DenoDeploy (${c.bold(c.brightGreen('live'))} ${label}):`);
  console.info('');
  console.info({ ok, code, deploy });
  console.info('');
  printDeployEndpoints(result);
}

export function printDeployEndpoints(result: DeployResult) {
  const row = (label: string, value: string) => {
    console.info(`  ${c.gray(`${label}:`.padEnd(11))} ${c.white(value)}`);
  };

  console.info(c.gray('Endpoints:'));
  if (result.deploy?.revisionUrl) row('revision', result.deploy.revisionUrl);
  if (result.deploy?.previewUrl) row('preview', result.deploy.previewUrl);
  console.info();
}
