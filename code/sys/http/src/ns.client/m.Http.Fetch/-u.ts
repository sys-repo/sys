import { type t, Cli, c } from '../../-test.ts';

export const print = (res: t.FetchResponse<unknown>) => {
  const table = Cli.table([]);

  table.push([c.cyan(' status:'), c.bold(String(res.status))]);
  table.push([c.cyan(' url:'), c.green(res.url)]);
  table.push([c.cyan(' hash (expected):'), res.checksum?.expected]);
  table.push([c.cyan(' hash (actual):'), res.checksum?.actual]);
  table.push([c.cyan(' data:')]);

  let data: any;
  if (typeof res.data === 'string') data = res.data;
  if (typeof res.data === 'object') data = JSON.stringify(res.data, null, '  ');

  console.info();
  console.info(table.toString().trim());
  console.info();
  console.info(c.italic(c.yellow(String(data || '(empty)'))));
  console.info();
  console.info(res.error?.cause);
  console.info();
};
