import { type t, D, Is } from './common.ts';

type Input = Pick<t.FileInfoPanel.Props, 'title' | 'transport' | 'endpoint' | 'path' | 'status'>;

export function toItems(input: Input): t.KeyValueItem[] {
  return [
    { kind: 'title', v: input.title ?? D.title },
    { k: 'status', v: input.status ?? '-', mono: true },
    { k: 'transport', v: input.transport ?? '-', mono: true },
    { k: 'endpoint', v: formatEndpoint(input.endpoint), mono: true },
    { k: 'path', v: input.path ?? '-', mono: true },
  ];
}

function formatEndpoint(value: t.StringUrl | URL | undefined): t.ReactNode {
  if (Is.nil(value)) return '-';
  return Is.urlLike(value) ? value.href : value;
}
