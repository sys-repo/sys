import React from 'react';
import { type t, Button, Color, Cropmarks, css, Time } from '../common.ts';

import { IFrame as IFrameView } from '@sys/ui-react-components';
import type { IFrameSchema } from '../-schemas/mod.ts';

export type IFrameHostProps = {
  data?: IFrameSchema;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const IFrameHost: React.FC<IFrameHostProps> = (props) => {
  const { data = {} } = props;
  const sandbox = data?.sandbox ?? true;

  /**
   * Hooks:
   */
  const [url, setUrl] = React.useState<t.StringUrl>('url');
  const [hrefButton, setHrefButton] = React.useState<t.ButtonFlags>();
  const [copied, setCopied] = React.useState(false);
  const [iframe, setIframe] = React.useState<React.RefObject<HTMLIFrameElement | null>>();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({
      position: 'relative',
      backgroundColor: Color.WHITE,
      display: 'grid',
    }),
    debug: {
      url: css({ Absolute: [-25, null, null, 0] }),
      label: css({ fontSize: 10, display: 'grid', gridAutoFlow: 'column', gap: 6 }),
      key: css({ opacity: 1 }),
      value: css({ opacity: hrefButton?.over ? 1 : 0.5 }),
      copied: css({ color: Color.GREEN }),
      sandboxed: css({}),
    },
  };

  const elBody = (
    <div className={styles.body.class}>
      <IFrameView
        {...data}
        sandbox={sandbox}
        onLoad={(e) => {
          console.info(`⚡️ IFrame.onLoad:`, e);
          setUrl(e.href);
          setIframe(e.ref);
        }}
      />
    </div>
  );

  const elUrl = url && (
    <div className={styles.debug.url.class}>
      <div className={styles.debug.label.class}>
        <span className={styles.debug.key.class}>{'src:'}</span>{' '}
        <Button
          theme={theme.name}
          onMouse={(e) => setHrefButton(e.is)}
          onClick={(e) => {
            navigator.clipboard.writeText(url ?? '<no url>');
            setCopied(true);
            Time.delay(1100, () => setCopied(false));
          }}
        >
          <span className={styles.debug.value.class}>{url ?? '<none>'}</span>
        </Button>
        {copied && <span className={styles.debug.copied.class}>{'copied'}</span>}
        {sandbox && <span className={styles.debug.sandboxed.class}>{'(sandboxed)'}</span>}
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04} size={{ mode: 'fill', margin: 60 }}>
        {elBody}
        {elUrl}
      </Cropmarks>
    </div>
  );
};
