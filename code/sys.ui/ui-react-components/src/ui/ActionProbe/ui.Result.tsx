import React from 'react';
import { type t, Switch, Color, css, KeyValue, Obj, D, ObjectView, Spinners } from './common.ts';

export const Result: React.FC<t.ActionProbe.ResultProps> = (props) => {
  const {
    debug = false,
    spinning = false,
    sizeMode = D.Result.sizeMode,
    resultsVisible = true,
    title,
  } = props;
  const obj = props.obj;

  const data = Obj.truncateStrings({ ...(props.response ?? {}) });
  const items = [...(props.items ?? [])];
  const hasItems = items.length > 0;
  const hasResponse = props.response !== undefined;
  const hasResult = hasItems || hasResponse;
  const showResult = resultsVisible && hasResult;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    spinner: css({
      Absolute: 0,
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
    body: {
      base: css({
        position: 'relative',
        display: 'grid',
        gridTemplateRows:
          showResult && hasItems && hasResponse
            ? `auto auto auto 1fr`
            : showResult && (hasItems || hasResponse)
              ? `auto auto 1fr`
              : 'auto',
        pointerEvents: spinning ? 'none' : 'auto',
        filter: `blur(${spinning ? 6 : 0}px) grayscale(${spinning ? 100 : 0}%)`,
        opacity: spinning ? 0.4 : 1,
        transition: 'opacity 100ms ease',
        fontSize: 11,
      }),
      top: css({ padding: 10 }),
      hr: css({ borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}` }),
      bottom: {
        base: css({ position: 'relative' }),
        inner: css({
          padding: 10,
          Scroll: sizeMode === 'fill' ? true : undefined,
          Absolute: sizeMode === 'fill' ? 0 : undefined,
        }),
      },
    },
    title: {
      base: css({
        padding: 10,
        borderBottom: `solid 2px ${Color.alpha(theme.fg, showResult && hasItems ? 0.1 : 0)}`,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        cursor: 'pointer',
      }),
      text: css({
        fontWeight: 600,
        opacity: showResult ? 1 : 0.3,
        transition: `opacity 120ms ease`,
        userSelect: 'none',
      }),
    },
    obj: css({}),
  };

  const elSpinner = spinning && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elTitle = (
    <div
      className={styles.title.base.class}
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-part="result-visibility-switch"]')) return;
        props.onResultsVisibleChange?.(!resultsVisible);
      }}
    >
      <div className={styles.title.text.class}>{title}</div>
      <div />
      <div data-part={'result-visibility-switch'}>
        <Switch
          theme={theme.name}
          height={18}
          value={resultsVisible}
          onClick={() => props.onResultsVisibleChange?.(!resultsVisible)}
        />
      </div>
    </div>
  );

  const elBody = (
    <div className={styles.body.base.class}>
      {elTitle}
      {showResult && hasItems && (
        <div className={styles.body.top.class}>
          <KeyValue.UI theme={theme.name} items={items} mono={props.header?.mono ?? true} />
        </div>
      )}
      {showResult && hasItems && hasResponse && <div className={styles.body.hr.class} />}
      {showResult && hasResponse && (
        <div className={styles.body.bottom.base.class}>
          <div className={styles.body.bottom.inner.class}>
            <ObjectView
              name={'action:result'}
              data={data}
              theme={theme.name}
              style={css(styles.obj, hasItems ? undefined : { marginTop: 0 })}
              expand={obj?.expand ?? 5}
              show={obj?.show}
              sortKeys={obj?.sortKeys}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elSpinner}
      {elBody}
    </div>
  );
};
