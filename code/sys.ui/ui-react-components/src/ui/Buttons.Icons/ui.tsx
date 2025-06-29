import React from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

type P = t.IconButtonProps;
type IconProps = P & { Renderer: t.IconRenderer };

/**
 * General Component:
 */
export const Icon: React.FC<IconProps> = (props) => {
  const { debug = false, size = 20 } = props;
  const Icon = props.Renderer;
  const styles = { base: css({ backgroundColor: Color.ruby(debug) }) };
  return (
    <Button {...props} style={css(styles.base, props.style)}>
      <Icon size={size} />
    </Button>
  );
};

const renderer = (Renderer: t.IconRenderer): React.FC<P> => {
  return (props: P) => <Icon {...props} Renderer={Renderer} />;
};

/**
 * Buttons Variants:
 */
export const Close = renderer(Icons.Close);
export const Face = renderer(Icons.Face);
