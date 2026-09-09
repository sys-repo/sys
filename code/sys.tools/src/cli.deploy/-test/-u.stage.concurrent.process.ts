import { Deploy } from '../mod.ts';
import { Err, Json, type t } from '../common.ts';

const [cwdRaw, configRaw] = Deno.args;
if (!cwdRaw || !configRaw) throw new Error('Expected staging cwd and config path.');

const cwd = cwdRaw as t.StringDir;
const config = configRaw as t.StringPath;

try {
  const result = await Deploy.stage({ cwd, config });
  console.info(Json.stringify({ ok: true, stagingRoot: result.stagingRoot }));
} catch (error) {
  console.info(Json.stringify({
    ok: false,
    error: Err.summary(error, { cause: true, stack: false }),
  }));
}
