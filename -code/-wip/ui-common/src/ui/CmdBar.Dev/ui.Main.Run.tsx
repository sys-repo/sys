import { isValidElement, useEffect, useState } from 'react';
import { Ctrl } from '../CmdBar.Ctrl/mod.ts';
import { Args, Color, css, Is, rx, type t } from './common.ts';

export const Run: React.FC<t.MainRunProps> = (props) => {
  const [rendered, setRendered] = useState<JSX.Element>();
  const [_args, setArgs] = useState<t.ParsedArgs | undefined>();

  /**
   * Lifecycle
   */
  useEffect(() => {
    const life = rx.lifecycle();
    const argv = props.argv;
    const args = argv ? Args.parse(argv.split(' ')) : undefined;
    setArgs(args);

    if (argv && props.onArgsChanged) {
      runHandler(argv, theme.name, props.onArgsChanged).then((res) => {
        if (life.disposed) return;
        if (res.el === null) setRendered(undefined);
        if (res.el) setRendered(res.el);
      });
    } else {
      setRendered(undefined);
    }

    return life.dispose;
  }, [props.argv]);

  useEffect(() => {
    const ctrl = wrangle.ctrl(props);
    const events = ctrl?.events();

    /**
     * Delegate to invoke handle.
     */
    events?.on('Invoke', async (e) => {
      if (!props.onInvoke) return;
      const argv = e.params.text;
      const res = await runHandler(argv, theme.name, props.onInvoke);
      if (res.el === null) setRendered(undefined);
      if (res.el) setRendered(res.el);
    });
    return events?.dispose;
  }, [props.ctrl]);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    empty: css({
      padding: 15,
      userSelect: 'none',
    }),
  };

  const elEmpty = !rendered && (
    <div {...styles.empty}>{/* <div>{`Module.Run → ƒ(n)`}</div> */}</div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elEmpty}
      {rendered}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  ctrl(props: t.MainRunProps) {
    return props.ctrl ? Ctrl.toCtrl(props.ctrl) : undefined;
  },
} as const;

async function runHandler(argv: string, theme: t.CommonTheme, fn: t.MainRunHandler) {
  argv = argv.trim();
  const args: t.ParsedArgs = Args.parse(argv.split(' '));
  let el: JSX.Element | undefined | null;

  const res = fn?.({
    theme,
    argv,
    args,
    render(e) {
      if (e === null) el = null;
      if (isValidElement(e)) el = e as JSX.Element;
    },
  });
  if (Is.promise(res)) await res;

  return { el } as const;
}
