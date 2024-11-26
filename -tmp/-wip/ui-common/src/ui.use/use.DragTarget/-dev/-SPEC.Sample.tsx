import { useDragTarget } from '../mod.ts';
import { Button, Color, ObjectView, css, type t } from './-common.ts';

const stripBinary = (dropped: t.Dropped) => {
  // NB: The Uint8Array is replaced with a string for display purposes. If left as the
  //     binary object, the UI will hanging, attempting to write it as integers to the DOM.
  const files = dropped.files.map((file) => ({
    ...file,
    data: `<Uint8Array>[${file.data.byteLength}]`,
  }));
  return { ...dropped, files };
};

export type SampleProps = {
  enabled?: boolean;
  suppressGlobal?: boolean;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { enabled, suppressGlobal } = props;

  const drag = useDragTarget({
    enabled,
    suppressGlobal,
    onDrop: (e) => console.log('⚡️ onDropped (optional)', e),
    onDragOver: (e) => console.log('⚡️ onDragOver (optional)', e),
  });

  const { is } = drag;
  const dropped = drag.dropped ? stripBinary(drag.dropped) : undefined;
  const data = { is, dropped };

  const styles = {
    base: css({ Absolute: 0, display: 'flex' }),
    body: {
      base: css({
        flex: 1,
        position: 'relative',
        opacity: drag.is.over ? 0.3 : 1,
        Flex: 'vertical-stretch-stretch',
      }),
      toolbar: {
        base: css({
          padding: 10,
          borderBottom: `solid 1px ${Color.format(-0.1)}`,
          Flex: 'horizontal-center-center',
        }),
        divider: css({ width: 30 }),
      },
      main: css({
        flex: 1,
        padding: 20,
        Scroll: true,
      }),
    },
    dragOver: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
      pointerEvents: 'none',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  const elSpacer = <div {...styles.body.toolbar.divider} />;

  const elDragOver = drag.is.over && (
    <div {...styles.dragOver}>
      <div>Drop File</div>
    </div>
  );

  const elToolbar = (
    <div {...styles.body.toolbar.base}>
      <Button onClick={() => drag.reset()}>Reset</Button>
      {elSpacer}
    </div>
  );

  const elMain = (
    <div {...styles.body.main}>
      <ObjectView name={'debug'} data={data} expand={10} />
    </div>
  );

  const elBody = (
    <div {...styles.body.base}>
      {elToolbar}
      {elMain}
    </div>
  );

  return (
    <div ref={drag.ref} {...styles.base}>
      {elBody}
      {elDragOver}
    </div>
  );
};
