import { css, useRenderer, type t } from '../common.ts';

export type DebugPanelBodyRow = {
  instance: t.DevInstance;
  renderer: t.DevRendererRef;
};

export const DebugPanelBodyRow: React.FC<DebugPanelBodyRow> = (props) => {
  const { instance, renderer } = props;
  const { element } = useRenderer(instance, renderer);

  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
    }),
  };

  return <div style={styles.base}>{element}</div>;
};
