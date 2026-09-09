import type { t } from './common.ts';

type StringSourceCode = string;

/** Factory: create a new editor fake. */
export type Create = (model?: t.MonacoFake.Model.Shape | t.Monaco.TextModel | StringSourceCode) => Full;

/** Minimal `IStandaloneCodeEditor` fake, cast with Monaco editor shape. */
export type Full = t.Monaco.Editor & Shape;

type UpdateOptionsArg = Parameters<t.Monaco.I.IStandaloneCodeEditor['updateOptions']>[0];

/** Minimal `IStandaloneCodeEditor` fake shape. */
export type Shape = t.EditorHiddenMembers &
  Pick<
    t.Monaco.I.IStandaloneCodeEditor,
    | 'getId'
    | 'getModel'
    | 'setModel'
    | 'getPosition'
    | 'setPosition'
    | 'getVisibleRanges'
    | 'onDidChangeCursorPosition'
    | 'onDidChangeModel'
    | 'onDidChangeConfiguration'
    | 'onKeyDown'
    | 'trigger'
    | 'executeEdits'
    | 'getOption'
    | 'updateOptions'
    | 'revealPositionInCenterIfOutsideViewport'
    | 'revealRangeInCenterIfOutsideViewport'
  > & {
    _emitDidChangeModel: () => void;
    _emitDidChangeConfiguration: () => void;
    _getViewModel: () => { getHiddenAreas: () => t.Monaco.I.IRange[] };
    _getUpdateOptionsCalls: () => readonly UpdateOptionsArg[];
    _setOption: (id: number, value: unknown) => void;
    _fireKeyDown: (args?: {
      key?: string;
      code?: string;
      shiftKey?: boolean;
      altKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
    }) => void;
  };
