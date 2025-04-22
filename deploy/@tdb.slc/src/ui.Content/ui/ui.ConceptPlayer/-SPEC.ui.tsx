import React from 'react';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { type t, Button, Color, css, Signal, Str } from './common.ts';

export type SampleProps = { debug: DebugSignals; style?: t.CssInput };

/**
 * Component:
 */
export const SampleBody: React.FC<SampleProps> = (props) => {
  const { debug } = props;
  const is = debug.is;

  const styles = {
    base: css({
      backgroundColor: Color.alpha(Color.RUBY, is.debug ? 0.1 : 0),
      borderRadius: 4,
      Margin: 10,
      Padding: 8,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {is.center && <SampleCenterBody debug={debug} />}
      {!is.center && <SampleRightBody debug={debug} />}
    </div>
  );
};

/**
 * Component:
 */
export const SampleCenterBody: React.FC<SampleProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const load = (title: string) => {
    return () => {
      p.columnAlign.value = 'Right';
      p.contentTitle.value = title;
      p.contentBody.value = <SampleContentBody debug={debug} />;
    };
  };

  const styles = {
    base: css({ paddingTop: 5 }),
    title: css({ fontWeight: 'bold' }),
    buttons: css({ marginTop: 20, lineHeight: 1.65 }),
  };

  const li = (label: string) => {
    return (
      <li>
        <Button label={label} onClick={load(label)} />
      </li>
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'👋 Center Body'}</div>
      <div className={styles.buttons.class}>
        <ul>
          {li('Module One')}
          {li('Module Two')}
          {li('Module Three')}
        </ul>
      </div>
    </div>
  );
};

/**
 * Component:
 */
export const SampleRightBody: React.FC<SampleProps> = (props) => {
  const { debug } = props;
  const styles = {
    base: css({}),
  };
  return (
    <div className={css(styles.base, props.style).class}>
      <div>{'👋 Right Body'}</div>
    </div>
  );
};

/**
 * Component:
 */
export type SampleContentBodyProps = SampleProps & { title?: string };
export const SampleContentBody: React.FC<SampleContentBodyProps> = (props) => {
  const { debug, title = 'Untitled' } = props;
  Signal.useRedrawEffect(() => debug.listen());
  const styles = {
    base: css({
      backgroundColor: Color.alpha(Color.RUBY, debug.is.debug ? 0.1 : 0),
      borderRadius: 4,
      Margin: 20,
      Padding: 30,
      lineHeight: 2,
      fontSize: 14,
    }),
  };
  return (
    <div className={css(styles.base, props.style).class}>
      <strong>{`ContentBody: "${title}"`}</strong>
      <div>
        <span>{Str.lorem}</span> <span>{Str.lorem}</span>
      </div>
    </div>
  );
};
