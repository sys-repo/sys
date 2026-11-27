import { Button } from '../Button/mod.ts';
import { Num, type t } from './common.ts';
import { newest } from './u.ts';
import { Items } from './ui.Value.Items.tsx';

type Props<E extends t.EventWithKind> = t.ItemsProps<E> & {
  readonly disclosure: t.Disclosure;
  readonly shown: number;
  readonly theme?: t.CommonTheme;
};

export function Count<E extends t.EventWithKind>(props: Props<E>) {
  const { items, shown, renderItem, theme, disclosure } = props;
  const { expanded: open, controls, onToggle } = disclosure;
  const total = items.length;
  const count = Num.toString(total);
  if (shown === 0) return count;

  const caption = open && shown < total ? `${Num.toString(shown)} of ${count}` : count;
  return (
    <>
      <Button
        label={caption}
        tone='accent'
        theme={theme}
        tooltip='Show or hide supplied events'
        aria-pressed={open}
        onClick={onToggle}
      />
      <div id={controls} hidden={!open}>
        {open && <Items items={newest(items, shown)} renderItem={renderItem} />}
      </div>
    </>
  );
}
