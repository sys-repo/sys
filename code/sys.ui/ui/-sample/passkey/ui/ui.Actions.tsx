import { Color, css, D, KeyValue, type t } from './common.ts';
import { actionsOf } from './u.actions.ts';
import { Action } from './ui.Action.tsx';

/**
 * Request controls only; the composing host owns titles and progress feedback.
 */
export const Actions: t.FC<t.Passkey.ActionsProps> = (props) => {
  const { debug = D.debug, operation } = props;
  const actions = actionsOf(props);
  if (actions.length === 0) return null;

  const theme = Color.theme(props.theme);
  const pending = operation.kind === 'pending';
  const styles = {
    base: css({ color: theme.fg, minWidth: 0, backgroundColor: Color.ruby(debug ? 0.1 : 0) }),
  };
  const items: t.KeyValue.Item[] = actions.map((action) => ({
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
  }));

  return (
    <div data-passkey-section='actions' className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} layout={D.layout} theme={theme.name} />
    </div>
  );
};
