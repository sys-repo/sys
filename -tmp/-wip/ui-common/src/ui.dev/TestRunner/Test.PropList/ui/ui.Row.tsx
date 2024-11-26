import { Theme, css, type t } from '../common';
import { Util } from '../u';
import { Body } from './ui.Row.Body';
import { Switch } from './ui.Row.Switch';
import { Title } from './ui.Row.Title';

export type SpecsRowProps = {
  theme: t.ColorTheme;
  data: t.TestPropListData;
  suite: t.TestSuiteModel;
  title: string;
  indent?: number;
  enabled?: boolean;
  style?: t.CssValue;
  onSelectionChange?: t.SpecsSelectionHandler;
  onRunClick?: t.SpecRunClickHandler;
};

export const SpecsRow: React.FC<SpecsRowProps> = (props) => {
  const { data, suite, title, enabled = true, theme } = props;
  const isSelected = Util.isSelected(data, suite);
  const isSelectable = Util.isSelectable(data);

  /**
   * Handlers
   */
  const handleSwitchClick = (e: React.MouseEvent) => {
    if (!enabled) return;
    props.onSelectionChange?.({
      suite,
      from: isSelected,
      to: !isSelected,
      modifiers: Util.modifiers(e),
    });
  };

  const handleBodyClick = (e: React.MouseEvent) => {
    if (!enabled) return;
    props.onRunClick?.({
      suite,
      modifiers: Util.modifiers(e),
    });
  };

  /**
   * [Render]
   */
  const styles = {
    base: css({
      flex: 1,
      position: 'relative',
      color: theme.fg,
    }),
    body: css({
      display: 'grid',
      paddingLeft: props.indent,
      gridTemplateColumns: isSelectable ? 'auto 1fr' : undefined,
      columnGap: 10,
    }),
  };

  const elSwitch = isSelectable && (
    <Switch isSelected={isSelected} onClick={handleSwitchClick} enabled={enabled} theme={theme} />
  );

  const elTitle = title && <Title text={title} theme={theme} />;

  const elBody = (
    <Body
      data={props.data}
      suite={suite}
      isSelected={isSelected}
      enabled={enabled}
      theme={theme}
      onClick={handleBodyClick}
    />
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elTitle}
      <div {...styles.body}>
        {elSwitch}
        {elBody}
      </div>
    </div>
  );
};
