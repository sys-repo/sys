import { TextSyntax } from '.';
import { Dev, css, type t } from '../../test.ui';

type T = {
  debug: {
    repeat: number;
    customColors: boolean;
    fixedWidth: boolean;
    textAsChildren: boolean;
  };
  props: t.TextSyntaxProps;
};
const initial: T = {
  debug: {
    repeat: 1,
    customColors: false,
    fixedWidth: false,
    textAsChildren: false,
  },
  props: {
    text: 'hello, <Component>.',
    inlineBlock: true,
    ellipsis: true,
    theme: 'Light',
    fontSize: 16,
    fontWeight: 'bold',
    monospace: true,
  },
};

export default Dev.describe('Test.syntax', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);
    ctx.subject.display('grid').render<T>((e) => {
      const { props, debug } = e.state;
      Dev.Theme.background(ctx, props.theme);

      const styles = {
        base: css({ width: debug.fixedWidth ? 300 : undefined }),
        multi: css({
          marginRight: props.inlineBlock ? 8 : 0,
          ':last-child': { marginRight: 0 },
        }),
      };

      const elements = Array.from({ length: debug.repeat }).map((v, i) => {
        const style = css(styles.base, debug.repeat > 1 ? styles.multi : undefined);
        const colors = debug.customColors ? { Brace: 'orange' } : undefined;
        return (
          <TextSyntax
            {...props}
            key={i}
            style={style}
            colors={colors}
            text={debug.textAsChildren ? undefined : props.text}
          >
            {debug.textAsChildren ? props.text : undefined}
          </TextSyntax>
        );
      });

      return <div>{elements}</div>;
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'TextSyntax'} data={e.state} expand={1} />);

    dev
      .title('Test Options')
      .boolean((btn) =>
        btn
          .label('multiple')
          .value((e) => e.state.debug.repeat !== 1)
          .onClick((e) => e.change((d) => (d.debug.repeat = d.debug.repeat === 1 ? 3 : 1))),
      )
      .boolean((btn) =>
        btn
          .label('fixed width')
          .value((e) => e.state.debug.fixedWidth)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'fixedWidth'))),
      )
      .boolean((btn) =>
        btn
          .label('custom colors')
          .value((e) => e.state.debug.customColors)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'customColors'))),
      )
      .boolean((btn) =>
        btn
          .label('text as children')
          .value((e) => e.state.debug.fixedWidth)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'textAsChildren'))),
      );

    dev.hr(-1, 5);

    Dev.Theme.switcher(
      dev,
      (d) => d.props.theme,
      (d, value) => (d.props.theme = value),
    );

    dev
      .hr()
      .title('Properties')
      .boolean((btn) =>
        btn
          .label('inlineBlock')
          .value((e) => e.state.props.inlineBlock)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'inlineBlock'))),
      )
      .boolean((btn) =>
        btn
          .label('ellipsis')
          .value((e) => e.state.props.ellipsis)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'ellipsis'))),
      )
      .boolean((btn) =>
        btn
          .label('monospace')
          .value((e) => e.state.props.monospace)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'monospace'))),
      )
      .boolean((btn) =>
        btn
          .label('bold')
          .value((e) => e.state.props.fontWeight === 'bold')
          .onClick((e) =>
            e.change(
              ({ props }) => (props.fontWeight = props.fontWeight === 'bold' ? 'normal' : 'bold'),
            ),
          ),
      );

    dev.hr().title('Text');

    const add = (label: string, text?: string) =>
      dev.button(label, (e) => e.change((d) => (d.props.text = text ?? label)));

    add('"" (empty)', '');
    add('hello, <Component>.');
    dev.hr();
    add('<Component>');
    add('{Object}');
    add('[List]');
    add('foo:bar');
    add('<foo:bar>');
    add('{One} <Two> foo:bar [List]');
    dev.hr();
    add('short: "my plain text."');
    add(
      'long: "Lorem ipsum..."',
      '<Lorem> {ipsum} dolor:sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque.',
    );
  });
});
