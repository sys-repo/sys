import { css, type t, useStylesheetRule } from './common.ts';

const sweep = 'sys-bar-spinner-sweep';
const pass: t.Msecs = 1000;
const cycle = `${pass * 2}ms`;
const startup: t.Msecs = 400;

/**
 * Paint one stationary mark by default;
 * animate two passes when motion is allowed.
 */
export function useSweep() {
  const mark = css({
    Absolute: 0,
    borderRadius: 2,
    backgroundColor: 'currentColor',
    transformOrigin: 'left center',
  });

  const lead = css(mark, {
    transform: 'translateX(35%) scaleX(0.3)',
    '--sys-bar-spinner-entry': entryPose(0.4),
    '--sys-bar-spinner-exit-scale': '0.65',
    // Start partway through the first pass so there is already ink at playback time zero.
    '--sys-bar-spinner-animation': `${sweep} ${cycle} ease-in-out -${startup}ms infinite`,
  }).class;

  const trail = css(mark, {
    transform: 'translateX(100%)',
    '--sys-bar-spinner-entry': entryPose(0.75),
    '--sys-bar-spinner-exit-scale': '0.1',
    '--sys-bar-spinner-animation': `${sweep} ${cycle} ease-out ${pass - startup}ms infinite`,
  }).class;

  // Clear the clip halfway through the cycle, then hold offscreen during the other pass.
  useStylesheetRule('50%, to', {
    transform: 'translateX(100%) scaleX(var(--sys-bar-spinner-exit-scale))',
  }, { context: `@keyframes ${sweep}` });
  useStylesheetRule(`.${lead}, .${trail}`, {
    transform: 'var(--sys-bar-spinner-entry)',
    animation: 'var(--sys-bar-spinner-animation)',
  }, { context: '@media (prefers-reduced-motion: no-preference)' });

  return { lead, trail };
}

/** At entry the mark's right edge meets the left edge of the clip. */
function entryPose(width: t.Percent) {
  return `translateX(-${width * 100}%) scaleX(${width})`;
}
