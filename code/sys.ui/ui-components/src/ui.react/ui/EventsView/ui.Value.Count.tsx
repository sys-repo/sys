import { Button } from '../Button/mod.ts';
import { Num, type t } from './common.ts';
import { newest } from './u.ts';
import { Items } from './ui.Value.Items.tsx';

type Props<E extends t.EventWithKind> = t.ItemsProps<E> & {
  readonly panel?: t.Panel;
  readonly shown: number;
  readonly theme?: t.CommonTheme;
};

export function Count<E extends t.EventWithKind>(props: Props<E>) {
  const { items, shown, renderItem, theme, panel } = props;
  const total = items.length;
  const count = Num.toString(total);
  const text = panel?.expanded && shown < total ? `${Num.toString(shown)} of ${count}` : count;
  const caption = <span style={{ fontFamily: 'sans-serif' }}>{text}</span>;
  if (!panel) return caption;
  const { expanded: open, controls, onToggle } = panel;
  return (
    <>
      <Button
        label={caption}
        tone='accent'
        theme={theme}
        tooltip='Show or hide supplied events'
        aria-expanded={open}
        aria-controls={controls}
        onClick={onToggle}
      />
      <div id={controls} hidden={!open}>
        {open && <Items items={newest(items, shown)} renderItem={renderItem} />}
      </div>
    </>
  );
}
