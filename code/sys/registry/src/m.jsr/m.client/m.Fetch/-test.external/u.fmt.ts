import { c, Cli } from '../../../-test.ts';

const externalTitle = (label: string) => {
  return `${c.bold(c.green('LIVE EXTERNAL'))} ${c.italic(c.green(label))}`;
};

const printExternalObject = (label: string, value: unknown) => {
  console.info();
  console.info(externalTitle(label), value);
  console.info();
};

const printExternalTable = (
  label: string,
  rows: { label: string; value: string }[],
  value?: string,
) => {
  const table = Cli.table([]);
  rows.forEach((row) => {
    table.push([c.cyan(` ${row.label}:`), row.value]);
  });

  console.info(externalTitle(label));
  console.info();
  console.info(table.toString().trim());
  if (value) {
    console.info();
    console.info(c.italic(c.green(value)));
  }
  console.info();
};

export const Fmt = {
  printExternalObject,
  printExternalTable,
} as const;
