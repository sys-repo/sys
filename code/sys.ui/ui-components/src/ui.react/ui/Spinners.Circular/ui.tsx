import { Color, css, D, Is, type t, useStylesheetRule } from './common.ts';

const pulse = 'sys-circular-spinner-pulse';
const { floor, fadeEnd, riseStart } = D.pulse;
const hold = `${fadeEnd * 100}%, ${riseStart * 100}%`;
const center = D.viewBoxSize / 2;

/** Render the shaded glyph even when motion is unavailable. */
export const CircularSpinner: t.FC<t.CircularSpinner.Props> = (props) => {
  const { size = D.size, theme, style } = props;
  const micro = size <= D.micro.maxSize;
  const count = micro ? D.micro.spokes : D.spokes;
  const innerY = micro ? D.micro.innerY : D.spoke.innerY;
  const selector = `[data-component="${D.displayName}"] > g > line`;
  const color = Is.nil(theme) ? undefined : Color.theme(theme).fg;
  const base = css({ color, flexShrink: 0, verticalAlign: 'middle' });

  // The underlying value supplies both bright endpoints; hold the dim tail between fades.
  useStylesheetRule(hold, { strokeOpacity: floor }, { context: `@keyframes ${pulse}` });
  useStylesheetRule(selector, {
    strokeOpacity: 1,
    animation: `${pulse} ${D.period}ms linear infinite`,
  }, { context: '@media (prefers-reduced-motion: no-preference)' });

  return (
    <svg
      aria-hidden='true'
      focusable='false'
      className={css(base, style).class}
      data-component={D.displayName}
      width={size}
      height={size}
      viewBox={`0 0 ${D.viewBoxSize} ${D.viewBoxSize}`}
    >
      {/* A different petal count needs one fresh animation start time for the whole ring. */}
      <g key={count} stroke='currentColor' strokeWidth={D.spoke.width} strokeLinecap='round'>
        {Array.from({ length: count }, (_, index) => {
          const phase = index / count;
          return (
            <line
              key={index}
              x1={center}
              x2={center}
              y1={D.spoke.width / 2}
              y2={innerY}
              strokeOpacity={inkAt(phase)}
              style={{ animationDelay: `${-phase * D.period}ms` }}
              transform={`rotate(${-phase * 360} ${center} ${center})`}
            />
          );
        })}
      </g>
    </svg>
  );
};

/** Paint the same starting frame before CSS runs and when motion is reduced. */
function inkAt(phase: number) {
  const light = Math.max(0, 1 - phase / fadeEnd, (phase - riseStart) / (1 - riseStart));
  return floor + (1 - floor) * light;
}
