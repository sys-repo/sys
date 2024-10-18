import { css, type t } from '../common.ts';

export type DevHostBackgroundProps = {
  renderProps?: t.DevRenderProps;
  style?: t.CssValue;
};

export const HostBackground: React.FC<DevHostBackgroundProps> = (props) => {
  const { renderProps } = props;

  const image = renderProps?.host.backgroundImage;
  const url = image?.url;
  if (!url) return null;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Absolute: 0,
      pointerEvents: 'none',
    }),
    body: css({
      Absolute: image.margin ?? 0,
      opacity: typeof image.opacity === 'number' ? image.opacity : undefined,
      backgroundImage: `url(${url})`,
      backgroundSize: image.size,
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    }),
  };
  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.body} />
    </div>
  );
};
