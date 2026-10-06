import { describe, expect, Fs, Hash, it, Str, Try } from '../../-test.ts';
import { attestIntegrity } from '../-test.external/u.html-integrity.attest.ts';

describe('HTML integrity adoption attestation', () => {
  it('written products → effective metadata, owned inventory, and failure controls', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.integrity.attest.' });
    const root = tmp.absolute;
    try {
      const js = 'console.info("entry");';
      const css = 'body { color: red; }';
      const dependency = 'export const value = "dependency";';
      await Fs.write(Fs.join(root, 'main.js'), js, { throw: true });
      await Fs.write(Fs.join(root, 'main.css'), css, { throw: true });
      await Fs.write(Fs.join(root, 'descendant.js'), dependency, { throw: true });
      const jsDigest = Hash.sha256(js, { encoding: 'base64' });
      const cssDigest = Hash.sha256(css, { encoding: 'base64' });
      const dependencyDigest = Hash.sha256(dependency, { encoding: 'base64' });
      const preload =
        `<link rel="modulepreload" href="./descendant.js" crossorigin integrity="${dependencyDigest}">`;
      const html = Str.dedent(`
        <script type="module" src="./main.js" crossorigin integrity="${jsDigest}"></script>
        <link rel="stylesheet" href="./main.css" crossorigin="anonymous" integrity="${cssDigest}">
        <link rel="modulepreload" href="./main.js" crossorigin integrity="${jsDigest}">
        ${preload}
        <link rel="stylesheet" href="https://external.invalid/fonts.css">
      `);
      const writeHtml = (text: string) =>
        Fs.write(Fs.join(root, 'index.html'), text, { throw: true });
      await writeHtml(html);
      const product = await attestIntegrity(root);
      expect(product.references.map((item) => item.kind)).to.eql([
        'module',
        'stylesheet',
        'modulepreload',
        'modulepreload',
      ]);
      expect(product.external).to.eql(['https://external.invalid/fonts.css']);
      for (const name of ['integrity', 'crossorigin']) {
        const missing = preload.replace(new RegExp(` ${name}(?:="[^"]*")?`), '');
        await writeHtml(html.replace(preload, missing));
        const { result } = await Try.run(() => attestIntegrity(root));
        expect(result.ok, `dependency ${name}`).to.eql(false);
      }

      for (const name of ['integrity', 'crossorigin', 'src', 'href']) {
        await writeHtml(html.replace(new RegExp(` ${name}(?==| )`), ` data-${name}`));
        const { result } = await Try.run(() => attestIntegrity(root));
        expect(result.ok, `data-${name} must not pass`).to.eql(false);
      }
      await writeHtml(html.replace(/ integrity="[^"]*"/g, ''));
      expect((await Try.run(() => attestIntegrity(root))).result.ok).to.eql(false);
      await writeHtml(html);
      await Fs.write(Fs.join(root, 'main.css'), `${css} /* later writer */`, { throw: true });
      expect((await Try.run(() => attestIntegrity(root))).result.ok).to.eql(false);
      await Fs.write(Fs.join(root, 'main.css'), css, { throw: true });
      expect((await attestIntegrity(root)).references).to.eql(product.references);
    } finally {
      await Fs.remove(root);
    }
  });
});
