import { Cmd, DEFAULTS, type t } from './common.ts';
import { Keyboard } from './Ctrl.keyboard.ts';
import { Mutate, Path, Selection, toCmd, toPaths } from './u.ts';

const DEF = DEFAULTS.props;

/**
 * Behavior logic for command signals.
 */
export function listen(args: {
  ctrl: t.CmdBarCtrl;
  textbox: t.TextInputRef;
  useKeyboard?: boolean;
  dispose$?: t.UntilObservable;
}): t.Lifecycle {
  const { ctrl, textbox, useKeyboard = DEF.useKeyboard } = args;
  const cmd = toCmd(ctrl);
  const doc = Cmd.toTransport(cmd);
  const paths = toPaths(cmd);
  const resolve = Path.resolver(paths);
  const events = cmd.events(args.dispose$);
  const isFocused = () => textbox.current.focused;

  if (useKeyboard) Keyboard.listen(ctrl, textbox, events.dispose$);

  events.on('Current', (e) => {
    const current = resolve(doc.current);
    const text = current.text;
    const spinning = current.meta.spinning ?? DEF.spinning;
    const readOnly = current.meta.readOnly ?? DEF.readOnly;
    cmd.invoke('Current:res', { text, spinning, readOnly }, e.tx);
  });

  events.on('Focus', (e) => {
    const { target = 'CmdBar' } = e.params;
    if (target === 'CmdBar') {
      textbox.focus();
      textbox.caretToEnd();
    }
    if (target === 'Main') {
      textbox.blur();
    }
  });
  events.on('Select', (e) => {
    const scope = e.params.scope ?? 'All';
    if (scope === 'All') textbox.selectAll();
    if (scope === 'Expand') Selection.expandBack(textbox);
    if (scope === 'Toggle:Full') Selection.toggleFull(textbox);
  });

  events.on('Caret:ToStart', () => textbox.caretToStart());
  events.on('Caret:ToEnd', () => textbox.caretToEnd());
  events.on('Keyboard', (e) => Keyboard.handleKeyAction(ctrl, e.params, isFocused()));

  events.on('Clear', () => doc.change((d) => Mutate.value(d, paths.text, '')));
  events.on('Update', (e) => {
    const { text, spinning, readOnly } = e.params;

    if (typeof text === 'string') {
      doc.change((d) => Mutate.value(d, paths.text, text));
    }

    if (typeof spinning === 'boolean') {
      doc.change((d) => Mutate.meta(d, paths, (meta) => (meta.spinning = spinning)));
    }

    if (typeof readOnly === 'boolean') {
      doc.change((d) => Mutate.meta(d, paths, (meta) => (meta.readOnly = readOnly)));
    }
  });

  return events;
}
