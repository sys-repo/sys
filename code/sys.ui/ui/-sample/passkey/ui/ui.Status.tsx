import { Bullet, Color, css, D, KeyValue, type t } from './common.ts';
import { EmptyValue } from './ui.EmptyValue.tsx';
import { Operation } from './ui.Operation.tsx';
import { Result } from './ui.Result.tsx';
import { Warning } from './ui.Warning.tsx';

/**
 * Authentication observations are independent of operation outcomes and prerequisite readiness.
 */
export const Status: t.FC<t.Passkey.StatusProps> = (props) => {
  const { debug = D.debug, authentication, operation, result } = props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, minWidth: 0, backgroundColor: Color.ruby(debug ? 0.1 : 0) }),
    value: css({ minWidth: 0, overflowWrap: 'anywhere', whiteSpace: 'normal' }),
  };
  const value = (text: string) => <div className={styles.value.class}>{text}</div>;
  const items: t.KeyValue.Item[] = [
    {
      id: 'authentication',
      k: 'Authentication',
      v: <AuthenticationValue authentication={authentication} theme={theme.name} />,
    },
    {
      id: 'principal',
      k: 'Principal',
      v: authentication.kind === 'signed-in' ? value(authentication.principal) : <EmptyValue />,
    },
  ];
  if (authentication.kind === 'signed-in') {
    const count = authentication.credentialCount;
    const text = count === undefined ? 'Unknown' : String(count);
    items.push({ id: 'credential-count', k: 'Registered keys', v: value(text) });
  }
  items.push(
    { id: 'operation', k: 'Operation', v: <Operation operation={operation} theme={theme.name} /> },
    { id: 'result', k: 'Last result', v: <Result result={result} /> },
  );

  return (
    <div data-passkey-section='status' className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} layout={D.layout} theme={theme.name} />
    </div>
  );
};

/**
 * Helpers:
 */

/** Readable authentication with a decorative cue; no operation-derived session claims. */
function AuthenticationValue(props: Pick<t.Passkey.StatusProps, 'authentication' | 'theme'>) {
  const { authentication } = props;
  const theme = Color.theme(props.theme);
  const text = authenticationText(authentication);
  let content: t.ReactNode = text;
  if (authentication.kind === 'unknown') {
    content = <Warning message={text} ariaLabel='Authentication unknown' theme={theme.name} />;
  }

  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
    }),
    text: css({ minWidth: 0, overflowWrap: 'anywhere', whiteSpace: 'normal' }),
  };
  return (
    <div className={styles.base.class}>
      <div className={styles.text.class}>{content}</div>
      <div aria-hidden='true'>
        <Bullet
          selected={authentication.kind === 'signed-in'}
          selectedColor={Color.GREEN}
          theme={theme.name}
        />
      </div>
    </div>
  );
}

/** Never collapse checking/unknown into a confirmed signed-out claim. */
function authenticationText(value: t.Passkey.Authentication): string {
  switch (value.kind) {
    case 'checking':
      return 'Checking session';
    case 'unknown':
      return `Unknown: ${value.summary}`;
    case 'signed-out':
      return 'Signed out';
    case 'signed-in':
      return 'Signed in';
  }
}
