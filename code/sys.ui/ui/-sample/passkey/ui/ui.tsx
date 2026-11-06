import { Color, css, D, Is, KeyValue, type t } from './common.ts';
import { actionsOf } from './u.actions.ts';
import { Action } from './ui.Action.tsx';
import { EmptyValue } from './ui.EmptyValue.tsx';
import { Operation } from './ui.Operation.tsx';
import { Result } from './ui.Result.tsx';
import { Warning } from './ui.Warning.tsx';

/**
 * Project supplied passkey observations and emit intent without owning authentication.
 */
export const Passkey: t.FC<t.Passkey.Props> = (props) => {
  const { debug = D.debug, snapshot } = props;
  const { authentication, operation, context, result } = snapshot;
  const theme = Color.theme(props.theme);
  const actions = actionsOf(props);
  const pending = operation.kind === 'pending';

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug ? 0.1 : 0),
      color: theme.fg,
      padding: 0,
      minWidth: 0,
    }),
    value: css({ minWidth: 0, overflowWrap: 'anywhere', whiteSpace: 'normal' }),
  };

  const value = (text: string) => <div className={styles.value.class}>{text}</div>;
  const items: t.KeyValue.Item[] = [
    { id: 'title', kind: 'title', y: [0, 1], v: D.name },
    ...actions.map((action): t.KeyValue.Item => ({
      id: action.id,
      k: action.key,
      v: (
        <Action
          label={action.label}
          reason={action.reason}
          pending={pending}
          onClick={action.onClick}
          theme={theme.name}
        />
      ),
    })),
  ];

  if (actions.length > 0) items.push({ id: 'actions-divider', kind: 'hr' });
  items.push(
    {
      id: 'authentication',
      k: 'Authentication',
      v: authentication.kind === 'unknown'
        ? (
          <Warning
            message={authenticationText(authentication)}
            ariaLabel='Authentication unknown'
            theme={theme.name}
          />
        )
        : value(authenticationText(authentication)),
    },
    {
      id: 'principal',
      k: 'Principal',
      v: authentication.kind === 'signed-in' ? value(authentication.principal) : <EmptyValue />,
    },
  );

  if (authentication.kind === 'signed-in') {
    items.push({
      id: 'credential-count',
      k: 'Registered keys',
      v: value(
        authentication.credentialCount === undefined
          ? 'Unknown'
          : String(authentication.credentialCount),
      ),
    });
  }

  items.push(
    {
      id: 'operation',
      k: 'Operation',
      v: <Operation operation={operation} theme={theme.name} />,
    },
    { id: 'result', k: 'Last result', v: <Result result={result} /> },
    { id: 'context-divider', kind: 'hr' },
    { id: 'context-title', kind: 'title', v: 'Context' },
    { id: 'origin', k: 'Origin', v: value(displayConfig(context.origin, 'Unknown')) },
    { id: 'rp-id', k: 'RP ID', v: value(displayConfig(context.rpId, 'Not configured')) },
    { id: 'web-authn', k: 'WebAuthn', v: value(availabilityText(context.webAuthn)) },
    { id: 'verifier', k: 'Verifier', v: value(availabilityText(context.verifier)) },
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <KeyValue.UI
        items={items}
        layout={{ kind: 'spaced', columnGap: 12, align: 'start' }}
        theme={theme.name}
      />
    </div>
  );
};

/**
 * Helpers:
 */
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

function availabilityText(value: t.Passkey.Availability): string {
  if (value.kind === 'available') return 'Available';
  return `${value.kind === 'unknown' ? 'Unknown' : 'Unavailable'}: ${value.reason}`;
}

function displayConfig(value: string | undefined, fallback: string): string {
  return value && !Is.blank(value) ? value : fallback;
}
