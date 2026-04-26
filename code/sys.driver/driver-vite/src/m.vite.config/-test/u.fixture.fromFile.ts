import { type t, Json, Path, Process, Str } from '../../-test.ts';

export async function probeFromFile(input?: string) {
  const modulePath = Path.resolve('./src/m.vite.config/mod.ts').replaceAll('\\', '/');
  const encoded = Json.stringify(input);
  const code = Str.dedent(`
    import { Json } from '@sys/std/json';
    import { ViteConfig } from ${Json.stringify(`file://${modulePath}`)};
    const res = await ViteConfig.fromFile(${encoded});
    console.log(Json.stringify(res));
  `);

  const output = await Process.invoke({
    cwd: Path.resolve('.'),
    args: ['eval', '--node-modules-dir=auto', code],
    silent: true,
  });

  if (!output.success) {
    throw new Error(output.text.stderr.trim() || output.text.stdout.trim() || 'ViteConfig.fromFile child probe failed');
  }

  return Json.parse(output.text.stdout.trim()) as t.ViteConfigFromFile;
}
