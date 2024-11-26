import { css, type t } from './common.ts';
import { ArgsCard } from './ui.Main.ArgsCard.tsx';

export function renderTop(props: t.MainArgsCardProps) {
  const gridTemplateRows = `1fr 1fr`;
  const styles = {
    base: css({ Absolute: 0, display: 'grid', gridTemplateRows }),
    main: css({ display: 'grid' }),
  };
  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.main}>
        <ArgsCard {...props} />
      </div>
      <div>{/* Spacer */}</div>
    </div>
  );
}
