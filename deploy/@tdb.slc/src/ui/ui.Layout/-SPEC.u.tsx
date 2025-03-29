import { type t, Button, AppContent, Signal } from './common.ts';

/**
 * Used to update a size of a DevHost subject based on the current size-breakpoint.
 */
export const updateForBreakpointSize = (dev: t.DevCtx, app: t.AppSignals) => {
  const breakpoint = app.props.screen.breakpoint.value;
  if (breakpoint === 'Mobile') dev.subject.size([390, 844]);
  if (breakpoint === 'Intermediate') dev.subject.size([600, 650]);
  if (breakpoint === 'Desktop') dev.subject.size('fill');
};

/**
 * Button: push content onto the stack.
 */
export const pushStackButton = (app: t.AppSignals, stage: t.ContentStage) => {
  return (
    <Button
      key={`stack.${stage}`}
      block
      label={`stack.push:( "${stage}" )`}
      onClick={async () => app.stack.push(await AppContent.find(stage))}
    />
  );
};

/**
 * Button Set: content pushing and clearing from the stack.
 */
export const pushStackContentButtons = (app: t.AppSignals) => {
  return [
    pushStackButton(app, 'Trailer'),
    pushStackButton(app, 'Overview'),
    pushStackButton(app, 'Programme'),

    <hr key={'stack.hr'} />,
    <Button key={'stack.pop'} block label={`stack.pop`} onClick={() => app.stack.pop(1)} />,
    <Button
      block
      key={'stack.clear'}
      label={`stack.clear( leave: 1 )`}
      onClick={() => app.stack.clear(1)}
    />,
  ];
};

/**
 * Button: cycle through screen breakpoints.
 */
export const screenBreakpointButton = (app: t.AppSignals) => {
  type T = t.BreakpointName;
  const p = app.props;
  const list: T[] = ['Desktop', 'Intermediate', 'Mobile'];
  return (
    <Button
      block
      label={`screen.breakpoint: ${p.screen.breakpoint ?? '<undefined>'}`}
      onClick={() => Signal.cycle<T>(p.screen.breakpoint, list)}
    />
  );
};
