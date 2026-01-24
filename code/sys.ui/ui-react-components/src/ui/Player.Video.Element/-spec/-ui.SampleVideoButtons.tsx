import React from 'react';
import { Button } from '../../u.ts';
import { type t, Color, css, Str, Time, Url } from '../common.ts';
import { KeyValue } from '../../KeyValue/mod.ts';

export const SAMPLE_BASEURLS = [
  'https://fs.socialleancanvas.com',
  'http://localhost:4040',
] as const;
export const SAMPLE_PATHS = [
  '/video/540p/1068502644.mp4',
  '/video/540p/1068653222.mp4',
  '/video/v2/core/sha256-3ee12096a189525fcbb0e85d1781fc414e46e8c306b6ee170af17fe8bd2b11c7.webm',
] as const;

export type SampleVideoButtonsProps = {
  baseUrl?: t.StringUrl;
  signal?: t.Signal<t.StringPath | undefined>;
  title?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SampleVideoButtons: React.FC<SampleVideoButtonsProps> = (props) => {
  const { debug = false, baseUrl, signal, title = 'Sample Videos' } = props;
  const [copied, setCopied] = React.useState(false);

  if (!baseUrl || !signal) return null;

  const handleCopy = () => {
    const url = Url.parse(baseUrl).join(signal.value ?? '');
    navigator.clipboard.writeText(url);
    setCopied(true);
    Time.delay(1500, () => setCopied(false));
  };

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
    faded: css({ opacity: 0.5 }),
  };

  const items: t.KeyValueItem[] = [
    { kind: 'title', v: title },
    { k: 'base url', v: <span className={styles.faded.class}>{baseUrl}</span>, mono: true },
    ...SAMPLE_PATHS.map((path, i) => ({
      mono: true,
      k: `path ${i + 1}`,
      v: (
        <Button
          label={`${Str.truncate(path, 40)} ${path === signal.value ? '🌳' : ''}`}
          onClick={() => (signal.value = path)}
        />
      ),
    })),
    { k: <Button label={copied ? 'copied' : '(copy url)'} onClick={handleCopy} /> },
  ];

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI layout={{ kind: 'table' }} items={items} theme={theme.name} />
    </div>
  );
};
