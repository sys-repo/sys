import type { t } from './common.ts';

export function deriveState(args: t.UsePlayControlsPropsArgs) {
  const { controller, snapshot, decks } = args;
  const state = snapshot?.state;
  const timeline = state?.timeline;

  const activeDeck = state?.decks.active ?? 'A';
  const activeSignals = decks?.[activeDeck];
  const status = state?.decks.status[activeDeck];
  const ready = state?.ready.deck?.[activeDeck];

  const playing = status === 'playing';
  const buffering = status === 'buffering' || ready === false;
  const currentTime = asSecs(state?.vTime);
  const duration = asSecs(timeline?.virtualDuration);
  const muted = activeSignals?.props.muted.value;
  const enabled = !!controller && !!timeline;

  return {
    controller,
    timeline,
    decks,
    activeSignals,
    props: { enabled, playing, muted, buffering, currentTime, duration },
  } as const;
}

/**
 * Helpers:
 */
function asSecs(value?: t.Msecs): t.Secs | undefined {
  if (value == null) return undefined;
  return Number(value) / 1000;
}
