import { useEffect } from 'react';
import { Ctrl } from '../CmdBar.Ctrl/mod.ts';
import { Args, Color, KeyHint, css, useFocus, type t } from './common.ts';
import { ArgsCardArgs } from './ui.Main.ArgsCard.Args.tsx';

export const ArgsCard: React.FC<t.MainArgsCardProps> = (props) => {
  const { size = [450, 200], focused = {} } = props;
  const args: t.ParsedArgs = Args.parse((props.argv ?? '').split(' '));

  const focus = useFocus();
  const isMainFocused = focus.containsFocus;
  const isFocused = isMainFocused || focused.cmdbar;

  /**
   * Lifecycle
   */
  useEffect(() => {
    const ctrl = wrangle.ctrl(props);
    const events = ctrl?.events();
    events?.on('Focus', (e) => {
      if (e.params.target === 'Main') focus.invoke();
    });
    return events?.dispose;
  }, [props.ctrl]);

  /**
   * Render
   */
  const t = (prop: string, time: t.Msecs = 100) => `${prop} ${time}ms`;
  const transitions = [
    t('opacity'),
    t('font-size'),
    t('background-color'),
    t('border-color'),
    t('box-shadow'),
  ];
  const transition = transitions.join(', ');
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      userSelect: 'none',
      outline: 'none',
      filter: `grayscale(${isFocused ? 0 : 100}%)`,
      transition,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      position: 'relative',
      width: size[0],
      height: size[1],
      display: 'grid',
      cursor: isFocused ? 'default' : 'pointer',
      transform: !isFocused ? `perspective(600px) rotateX(30deg) translateZ(-5px)` : undefined,
      transition: t('transform', 300),
      pointerEvents: 'auto',
    }),
    content: css({
      opacity: isFocused ? 1 : 0.8,
      display: 'grid',
      placeItems: 'center',
    }),
    border: css({
      position: 'relative',
      pointerEvents: 'none',
      Absolute: 8,
      borderRadius: 10,
      border: `${isMainFocused ? 'solid' : 'dashed'} 1.5px`,
      borderColor: isMainFocused ? Color.BLUE : Color.alpha(theme.fg, 0.9),
      boxShadow: isMainFocused
        ? `0 2px 30px 0 ${Color.format(theme.is.dark ? -0.5 : -0.15)}`
        : undefined,
      opacity: isFocused ? 0.8 : 0.5,
      backgroundColor: theme.is.light
        ? Color.alpha(theme.bg, isMainFocused ? 0.5 : 0)
        : Color.alpha(theme.fg, isMainFocused ? 0.02 : 0),
      transition,
      display: 'grid',
    }),
    labelTitle: {
      base: css({
        Absolute: [-15, 15, null, 15],
        fontFamily: 'monospace',
        fontSize: 10,
        opacity: isFocused ? 1 : 0.3,
        transition,

        display: 'grid',
        gridTemplateColumns: `auto 1fr auto`,
      }),
      text: css({ transition }),
      left: css({}),
      right: css({}),
    },
    keyHint: css({
      Absolute: [null, 0, -25, 0],
      transition,
      display: 'grid',
      placeItems: 'center',
    }),
    piggy: css({
      Absolute: 0,
      pointerEvents: 'none',
      fontSize: 48,
      textShadow: `0px 4px 18px ${Color.format(theme.is.light ? 0 : isFocused ? -0.3 : -0.1)}`,
      opacity: isFocused ? 1 : theme.is.dark ? 0.2 : 0.4,
      transition,

      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elArgs = args && (
    <ArgsCardArgs args={args} isFocused={isFocused} style={{ Absolute: 15 }} theme={theme.name} />
  );

  const elKeyHint = (
    <div {...styles.keyHint}>
      <KeyHint text={'META + J'} theme={theme.name} />
    </div>
  );

  const title = wrangle.title(props);
  const elLabelTitle = (
    <div {...styles.labelTitle.base}>
      <div {...css(styles.labelTitle.text, styles.labelTitle.left)}>{title.left}</div>
      <div />
      <div {...css(styles.labelTitle.text, styles.labelTitle.right)}>{title.right}</div>
    </div>
  );

  return (
    <div {...css(styles.base, props.style)} ref={focus.ref} tabIndex={0}>
      <div {...styles.body}>
        {elKeyHint}
        {elLabelTitle}
        <div {...styles.content}>
          <div {...styles.border}>
            <div />
          </div>
          {elArgs}
          <div {...styles.piggy}>{'🐷'}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  ctrl(props: t.MainArgsCardProps) {
    return props.ctrl ? Ctrl.toCtrl(props.ctrl) : undefined;
  },

  title(props: t.MainArgsCardProps) {
    const { title = true } = props;
    if (title === false) return { left: '', right: '' };
    const left = typeof title === 'object' ? title.left || '' : '';
    const right = typeof title === 'object' ? title.right || '' : 'main';
    return { left, right } as const;
  },
} as const;
