import { css, type t } from './common.ts';

const list = css({
  margin: 0,
  paddingInlineStart: '1.25em',
  textAlign: 'start',
});

export function Items<E extends t.EventWithKind>({ items, renderItem }: t.ItemsProps<E>) {
  const render = renderItem ?? ((event: E) => event.kind);
  if (items.length === 0) return null;
  if (items.length === 1) return render(items[0]);
  return (
    <ul className={list.class}>
      {items.map((event, index) => <li key={index}>{render(event)}</li>)}
    </ul>
  );
}
