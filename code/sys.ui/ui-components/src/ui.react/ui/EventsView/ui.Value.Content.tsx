import { css, D, Is, type t } from './common.ts';
import { newest, shownCount } from './u.ts';
import { Count } from './ui.Value.Count.tsx';
import { EmptyValue } from './ui.Value.Empty.tsx';
import { Items } from './ui.Value.Items.tsx';

type Props<E extends t.EventWithKind> = Omit<t.EventsView.ValueProps<E>, 'disclosure'> & {
  readonly panel?: t.Panel;
};

const valueStyle = css({ minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' });

export function ValueContent<E extends t.EventWithKind>(props: Props<E>) {
  const content = renderContent(props);
  if (Is.nil(content)) return null;
  return <div className={css(valueStyle, props.style).class}>{content}</div>;
}

function renderContent<E extends t.EventWithKind>(props: Props<E>) {
  const { items, renderItem, mode = D.mode, tail, theme, panel } = props;
  if (items.length === 0) return mode === 'list' ? null : <EmptyValue />;

  const shown = shownCount(items.length, tail);
  if (mode === 'list') return <Items items={newest(items, shown)} renderItem={renderItem} />;
  return <Count {...{ items, shown, renderItem, theme, panel }} />;
}
