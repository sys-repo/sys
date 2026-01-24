import React from 'react';
import { Button } from '../../u.ts';
import { type t, Color, css, Str, Time, Url } from '../common.ts';

const PATHS = [
  '/video/540p/1068502644.mp4',
  '/video/540p/1068653222.mp4',
  '/video/v2/core/sha256-3ee12096a189525fcbb0e85d1781fc414e46e8c306b6ee170af17fe8bd2b11c7.webm',
] as const;

export type SampleVideoButtonsProps = {
  baseUrl?: t.StringUrl;
  signal?: t.Signal<t.StringPath | undefined>;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SampleVideoButtons: React.FC<SampleVideoButtonsProps> = (props) => {
  const { debug = false, baseUrl, signal } = props;
  const [copied, setCopied] = React.useState(false);

  if (!baseUrl) return null;
  if (!signal) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  const elButtons = PATHS.map((path) => videoButton(baseUrl, path, signal));

  return (
    <div className={css(styles.base, props.style).class}>
      {elButtons}
      <Button
        block
        label={() => (copied ? 'copied' : `(copy url)`)}
        onClick={() => {
          const url = toUrl(baseUrl, signal.value ?? '');
          navigator.clipboard.writeText(url);
          setCopied(true);
          Time.delay(1500, () => setCopied(false));
        }}
      />
    </div>
  );
};

/**
 * Helpers
 */
export function videoButton(
  baseUrl: t.StringUrl,
  path: t.StringPath,
  signal: t.Signal<t.StringPath | undefined>,
) {
  const url = toUrl(baseUrl, path);
  const isCurrent = path == signal.value;
  let label = `src: ${path.slice(0, 10)} .. ${url.slice(-10)}`;
  label = Str.truncate(label, 30);
  if (isCurrent) label += ' 🌳';
  return <Button key={path} block label={label} onClick={() => (signal.value = path)} />;
}

function toUrl(baseUrl: t.StringUrl, path: t.StringPath) {
  return Url.parse(baseUrl).join(path ?? '');
}
