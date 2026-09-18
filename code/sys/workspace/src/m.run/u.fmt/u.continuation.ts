import { c } from '../common.ts';

type ContinuationTone = 'cyan' | 'green' | 'red' | 'yellow';

/** Format one bounded-list continuation with a semantic count token. */
export function formatContinuationSummary(
  countText: string,
  tone: ContinuationTone,
  qualifier?: string,
): string {
  const countToken = c.italic(`+${countText}`);
  const semanticCount = colorCount(countToken, tone);
  const suffix = qualifier ? ` more ${qualifier}` : ' more';
  return [
    c.gray(c.italic('...')),
    semanticCount,
    c.gray(c.italic(suffix)),
  ].join('');
}

function colorCount(countToken: string, tone: ContinuationTone) {
  switch (tone) {
    case 'cyan':
      return c.cyan(countToken);
    case 'green':
      return c.green(countToken);
    case 'red':
      return c.red(countToken);
    case 'yellow':
      return c.yellow(countToken);
  }
}
