import { useId } from 'react';
import { Admonition, Color, css, D, KeyValue, type t } from './common.ts';
import { actionsOf } from './u.actions.ts';
import { Action } from './ui.Action.tsx';

/** Standalone Actions keeps the registration hint with its controls. */
export const Actions: t.FC<t.Passkey.ActionsProps> = (props) => {
  const { controls, note } = useActionParts(props);
  return <>{controls}{note}</>;
};

/** The host supplies the note; eligibility controls only the button-to-note association. */
export function useActionParts(props: t.Passkey.ActionsProps) {
  const { debug = D.debug, operation } = props;
  const noteId = useId();
  const actions = actionsOf(props);
  const theme = Color.theme(props.theme);
  const advisory = props.context.registrationAdvisory;
  const note = advisory && (
    <Admonition.UI id={noteId} markdown={advisory} theme={theme.name} style={{ marginTop: 20 }} />
  );
  if (actions.length === 0) return { controls: null, note };

  const pending = operation.kind !== 'idle';
  const registration = actions.find(({ id, reason }) =>
    !reason && (id === 'create-account' || id === 'add-passkey')
  );
  const styles = {
    base: css({ color: theme.fg, minWidth: 0, backgroundColor: Color.ruby(debug ? 0.1 : 0) }),
  };
  const items: t.KeyValue.Item[] = actions.map((action) => ({
    id: action.id,
    k: action.key,
    v: (
      <Action
        label={action.label}
        variant={action.id === 'create-account' ? 'text' : 'filled'}
        reason={action.reason}
        aria-describedby={advisory && action === registration ? noteId : undefined}
        pending={pending}
        onClick={action.onClick}
        theme={theme.name}
      />
    ),
  }));

  const controls = (
    <div data-passkey-section='actions' className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} layout={D.layout} theme={theme.name} />
    </div>
  );
  return { controls, note };
}
