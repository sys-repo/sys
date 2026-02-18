import { c, Cli } from '@sys/cli';
import { Path } from '@sys/fs';
import { generate } from 'jsr:@kitsonk/md2pdf';

const DEFAULT_PDF_CSS = `
  body {
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 10pt;
    line-height: 1.45;
  }

  h1, h2, h3 {
    letter-spacing: 0.01em;
    margin-top: 1.2em;
    color: red;
  }

  p, li {
    margin: 0.2em 0;
  }
`;

export async function mdFileToPdf(path: string): Promise<string> {
  const markdown = await Deno.readTextFile(path);
  const name = Path.basename(path, Path.extname(path));
  const outPath = Path.join(Path.dirname(path), `${name}.pdf`);

  const pdfBytes = await generate(markdown, {
    title: name,
    additionalCss: DEFAULT_PDF_CSS,
  });

  await Deno.writeFile(outPath, pdfBytes);
  return outPath;
}

if (import.meta.main) {
  const path = Deno.args[0];
  if (!path) {
    console.error('Usage: deno run -A /tmp/md-to-pdf.ts <file.md>');
    Deno.exit(1);
  }

  const out = await mdFileToPdf(path);
  const table = Cli.table([]);
  table.push([c.bold(c.green('PDF Build Complete')), c.cyan('md2pdf')]);
  table.push([c.gray('input'), c.white(path)]);
  table.push([c.gray('output'), c.cyan(out)]);
  console.info(table.toString());
}
