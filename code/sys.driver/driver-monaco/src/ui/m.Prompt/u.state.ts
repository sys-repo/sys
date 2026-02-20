import { type t, D, Num } from './common.ts';
import { normalize } from './u.normalize.ts';

export const state: t.EditorPrompt.CalculateState = (args) => {
  const config = normalize(args.config);
  const lineCount = Num.clamp(1, Num.MAX_INT, Math.trunc(args.lineCount || D.lineCount));
  const visibleLines = Num.clamp(config.lines.min, config.lines.max, lineCount);
  const atMax = lineCount >= config.lines.max;
  const overflowing = lineCount > config.lines.max;
  const scrolling = config.overflow === 'scroll' && overflowing;
  const lineHeight = Num.clamp(1, Num.MAX_INT, Math.trunc(args.lineHeight));
  const height = visibleLines * lineHeight;

  return {
    line: {
      count: lineCount,
      visible: visibleLines,
      is: { max: atMax },
    },
    scrolling,
    height,
  };
};

export const resolveEnterAction: t.EditorPrompt.ResolveEnterAction = (args) => {
  const config = normalize(args?.config);
  const modifiers = args?.modifiers ?? {};
  const isModified = !!(modifiers.ctrl || modifiers.meta);
  return isModified ? config.enter.onModifiedEnter : config.enter.onEnter;
};
