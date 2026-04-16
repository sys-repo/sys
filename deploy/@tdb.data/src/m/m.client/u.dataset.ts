import { type t, Url } from './common.ts';
import { create } from './u.create.ts';

export function fromDataset(args: t.SlcDataClient.DatasetArgs): t.SlcDataClient.Client {
  const dataset = String(args.dataset).trim();
  const docid = (args.docid ?? dataset) as t.StringId;
  const baseUrl = Url.parse(args.origin).join(dataset) as t.StringUrl;
  return create({ baseUrl, docid, layout: args.layout });
}
