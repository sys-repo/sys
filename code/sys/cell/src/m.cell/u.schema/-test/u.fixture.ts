import { Fs, Yaml } from '../../../-test.ts';

export async function loadStripeDescriptor(): Promise<unknown> {
  const url = new URL(
    '../../../../-sample/cell.stripe/-config/@sys.cell/cell.yaml',
    import.meta.url,
  );
  const read = await Fs.readText(url.pathname);
  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) throw parsed.error;
  return parsed.data;
}
