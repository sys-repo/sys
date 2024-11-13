import { forwardRef } from 'react';

import { Flip } from '../Flip/mod.ts';
import { CardBody } from './Card.Body.tsx';
import { Color, DEFAULTS, Style, css, type t } from './common.ts';
import { Wrangle } from './u.ts';

/**
 * Component
 */
export const Card = forwardRef<HTMLDivElement, t.CardProps>((props: t.CardProps, ref: any) => {
  const { showAsCard = true, backside } = props;

  const bg = Wrangle.bg(props);
  const border = Wrangle.border(props);
  const shadow = Wrangle.shadow(props);
  const size = Wrangle.size(props);
  const showBackside = Wrangle.showBackside(props);

  /**
   * Handlers
   */
  const focusHandler = (focused: boolean) => () => props.onFocusChange?.({ focused });

  /**
   * Render
   */
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      userSelect: Wrangle.userSelect(props),
      outline: 'none',

      width: size.width?.fixed,
      height: size.height?.fixed,
      minWidth: size.width?.min ?? 10,
      minHeight: size.height?.min ?? 10,
      maxWidth: size.width?.max,
      maxHeight: size.height?.max,
      ...Style.toMargins(props.margin),

      display: 'grid',
    }),
    card: css({
      border: `solid 1px ${Color.format(border.color)}`,
      borderRadius: border.radius,
      backgroundColor: Color.format(bg.color),
      backdropFilter: typeof bg.blur === 'number' ? `blur(${bg.blur}px)` : undefined,
      boxShadow: Style.toShadow(shadow),
      transition: `box-shadow 0.1s ease`,
      display: 'grid',
    }),
  };

  const sideStyle = showAsCard ? styles.card : undefined;
  const elFront = (
    <div {...sideStyle}>
      <CardBody header={props.header} footer={props.footer} padding={props.padding}>
        {props.children}
      </CardBody>
    </div>
  );
  const elBack = backside && (
    <div {...sideStyle}>
      <CardBody padding={props.padding}>{backside}</CardBody>
    </div>
  );

  return (
    <div
      ref={ref}
      tabIndex={Wrangle.tabIndex(props)}
      {...css(styles.base, props.style)}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      onFocus={focusHandler(true)}
      onBlur={focusHandler(false)}
    >
      <Flip
        flipped={showBackside.flipped}
        speed={showBackside.speed}
        front={elFront}
        back={elBack}
      />
    </div>
  );
});

Card.displayName = DEFAULTS.displayName;
