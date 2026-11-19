import React from 'react';
import { Color, css, D, KeyValue, Spinners, type t } from './common.ts';
import { actionsOf } from './u.actions.ts';
import { Actions } from './ui.Actions.tsx';
import { Context } from './ui.Context.tsx';
import { Status } from './ui.Status.tsx';

/**
 * Compose the same independent sections without owning authentication or duplicating their rows.
 */
export const Passkey: t.FC<t.Passkey.Props> = (props) => {
  const { debug = D.debug, snapshot, sections = D.sections } = props;
  const theme = Color.theme(props.theme);
  const { authentication, operation, context: configuration, result } = snapshot;
  const requests: t.Passkey.ActionsProps = {
    authentication,
    operation,
    context: configuration,
    onCreateAccount: props.onCreateAccount,
    onSignIn: props.onSignIn,
    onAddPasskey: props.onAddPasskey,
    onSignOut: props.onSignOut,
    theme: theme.name,
  };
  const actions = (sections.actions ?? D.sections.actions) && actionsOf(requests).length > 0;
  const status = sections.status ?? D.sections.status;
  const context = sections.context ?? D.sections.context;
  if (!actions && !status && !context) return null;

  const base = css({
    backgroundColor: Color.ruby(debug ? 0.1 : 0),
    color: theme.fg,
    padding: 0,
    minWidth: 0,
  });
  // Reserve space within the existing title line, never a new pending-only row.
  const titlePending = !status && operation.kind === 'pending';
  const activityStyle = css({
    display: 'inline-grid',
    verticalAlign: 'middle',
    width: D.spinner.width,
    height: D.spinner.height,
  });
  const elSpinner = titlePending && (
    <div aria-hidden='true'>
      <Spinners.Bar width={D.spinner.width} height={D.spinner.height} theme={theme.name} />
    </div>
  );
  const elActivity = (
    <div
      key='activity'
      data-passkey-title-spinner=''
      className={activityStyle.class}
      role={titlePending ? 'progressbar' : undefined}
      aria-label={titlePending ? 'Passkey operation in progress' : undefined}
    >
      {elSpinner}
    </div>
  );
  const appearance = { theme: theme.name };
  const divider = (before: string) => (
    <div key='divider' data-passkey-divider={before} aria-hidden='true'>
      <KeyValue.UI
        items={[{ id: `${before}-divider`, kind: 'hr', y: 5 + D.layout.rowGap }]}
        theme={theme.name}
      />
    </div>
  );

  const elTitle = (
    <KeyValue.UI
      key='title'
      items={[{ id: 'title', kind: 'title', y: [0, 1], v: [D.name, elActivity] }]}
      theme={theme.name}
      style={{ marginBottom: D.layout.rowGap }}
    />
  );
  const elActions = actions && <Actions key='actions' {...requests} />;
  const elStatusDivider = actions && divider('status');
  const elStatus = status && (
    <React.Fragment key='status'>
      {elStatusDivider}
      <Status
        key='content'
        authentication={authentication}
        operation={operation}
        result={result}
        {...appearance}
      />
    </React.Fragment>
  );
  const elContextDivider = (actions || status) && divider('context');
  const elContext = context && (
    <React.Fragment key='context'>
      {elContextDivider}
      <Context key='content' context={snapshot.context} {...appearance} />
    </React.Fragment>
  );

  return (
    <div className={css(base, props.style).class} data-component={D.displayName}>
      {elTitle}
      {elActions}
      {elStatus}
      {elContext}
    </div>
  );
};
