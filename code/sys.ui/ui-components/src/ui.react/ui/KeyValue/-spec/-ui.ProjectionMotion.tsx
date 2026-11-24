import { css, Dev, Signal, type t } from './common.ts';
import { SAMPLE } from './-samples.tsx';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type Props = { debug: DebugSignals; theme?: t.CommonTheme };

export function ProjectionMotion({ debug, theme }: Props) {
  const { animation, items, reorder, sample } = debug.props;
  const enabled = !reorder.value;
  const styles = {
    section: css({ display: 'grid', gap: 4, marginTop: 12 }),
    note: css({ fontSize: 12, opacity: 0.6 }),
  };

  return (
    <section className={styles.section.class}>
      <strong>Projection motion</strong>
      <Dev.Button
        block
        label={() => `animation: ${animation.value}`}
        onClick={() => Signal.toggle(animation)}
      />
      {!enabled && (
        <div className={styles.note.class}>
          Turn reorder off to test this prop; Reorder has its own Motion animation.
        </div>
      )}
      <Dev.List
        theme={theme}
        items={[
          {
            id: 'shuffle',
            label: 'Shuffle direct children',
            enabled,
            onActivate: () => (items.value = shuffleItems(items.value)),
          },
          {
            id: 'move',
            label: 'Move one direct child',
            enabled,
            onActivate: () => (items.value = moveRandomItem(items.value)),
          },
          {
            id: 'restore',
            label: 'Restore sample order',
            enabled,
            onActivate: () => (items.value = SAMPLE.items(sample.value)),
          },
        ]}
      />
    </section>
  );
}

function shuffleItems(items?: t.KeyValue.Item[]) {
  const next = [...(items ?? [])];
  // Fisher-Yates: sample from the remaining prefix at each position.
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function moveRandomItem(items?: t.KeyValue.Item[]) {
  const next = [...(items ?? [])];
  if (next.length < 2) return next;

  const from = Math.floor(Math.random() * next.length);
  const offset = Math.floor(Math.random() * (next.length - 1)) + 1;
  const to = (from + offset) % next.length;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
