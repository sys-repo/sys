import { Button } from '../mod.ts';
import type { DebugView } from './-SPEC.Debug.tsx';
import { FocusExamples, type FocusExamplesProps } from './-ui.FocusExamples.tsx';

type Props = FocusExamplesProps & { view?: DebugView };

/** Keep the primitive specimen free of comparison markup and layout. */
export function Root({ view = 'single', ...props }: Props) {
  if (view === 'variants') return <FocusExamples {...props} />;
  return <Button {...props}>👋 Hello Button</Button>;
}
