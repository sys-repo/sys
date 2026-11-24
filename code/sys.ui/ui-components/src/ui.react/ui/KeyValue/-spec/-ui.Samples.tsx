import { css, Dev, type t } from './common.ts';
import { SAMPLE, type SampleKind } from './-samples.tsx';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type Props = { debug: DebugSignals; theme?: t.CommonTheme };
type SampleId = SampleKind | 'none';

const samples = [
  { id: 'none', label: 'None' },
  { id: 'simple', label: 'Simple' },
  { id: 'comprehensive', label: 'Comprehensive' },
  { id: 'action-buttons', label: 'Action buttons' },
  { id: 'opacity', label: 'Opacity' },
  { id: 'links', label: 'Links' },
  { id: 'recursive', label: 'Recursive groups' },
  { id: 'reorder', label: 'Reorder' },
] as const satisfies readonly Pick<t.Dev.List.Item<SampleId>, 'id' | 'label'>[];

export function Samples({ debug, theme }: Props) {
  const { sample, items } = debug.props;
  const choices: readonly t.Dev.List.Item<SampleId>[] = samples.map(({ id, label }) => ({
    id,
    label,
    onActivate() {
      const kind = id === 'none' ? undefined : id;
      items.value = SAMPLE.items(kind);
      sample.value = kind;
    },
  }));

  return (
    <section className={css({ display: 'grid', gap: 4 }).class}>
      <strong>Samples</strong>
      <Dev.List theme={theme} columns={2} selected={sample.value ?? 'none'} items={choices} />
    </section>
  );
}
