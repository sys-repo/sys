import React from 'react';
import { createPortal } from 'react-dom';
import { D, type SampleProps } from './common.ts';

/** Paint-only portal into the production root; not proof of initial-commit registration timing. */
export function Subject(props: SampleProps) {
  const { UI } = props;
  const container = React.useRef<HTMLDivElement>(null);
  const [root, setRoot] = React.useState<Element | null>(null);
  React.useLayoutEffect(() => {
    setRoot(container.current!.querySelector(`[data-component="${D.displayName}"]`));
  }, []);
  return (
    <div ref={container}>
      <UI theme={props.theme} style={props.style} />
      {root && createPortal(props.children, root)}
    </div>
  );
}
