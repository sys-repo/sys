import { type t, Delete, CssEdges, Is } from './common.ts';

type K = keyof t.Style.Props;
type N = number | string | null;

/**
 * Convert a sloppy input into an {edges} property object
 * Input:
 *  - single value (eg. 0 or '5em')
 *  - 4-part array (eg. [10, null, 0, 5])
 *  - Y/X array    (eg. [20, 5])
 */
export function toEdges(
  input?: t.CssEdges.Input | t.Falsy | boolean,
  mutater?: t.CssEdges.Mutater,
): t.Style.Props {
  const done = (top?: N, right?: N, bottom?: N, left?: N) => {
    const res: t.Style.Props = {};
    const assign = (field: keyof t.Style.Props | null, value?: N) => {
      if (value == null || field == null) return;
      (res as any)[field] = value;
    };

    if (Is.func(mutater)) {
      const runMutation = (edge: keyof t.CssEdges.Shape, value?: N) => {
        let field: keyof t.Style.Props | null = edge;
        const payload: t.CssEdges.MutaterArgs = {
          current: { value, edge },
          changeField: (next) => (field = next),
          changeValue: (next) => (value = next),
        };
        mutater(payload);
        assign(field, value);
      };
      runMutation('top', top);
      runMutation('right', right);
      runMutation('bottom', bottom);
      runMutation('left', left);
    } else {
      assign('top', top);
      assign('right', right);
      assign('bottom', bottom);
      assign('left', left);
    }
    return res;
  };
  const fromArray = (input: t.CssEdges.Array) => {
    const [top, right, bottom, left] = CssEdges.toArray(input);
    return done(top, right, bottom, left);
  };

  if (input == null) return {};
  if (Is.str(input) && input.includes(' ')) {
    const parts = input.split(' ').map((v) => (Is.numeric(v) ? Number(v) : v));
    return fromArray(parts as t.CssEdges.Array);
  }
  if (isEdgeValue(input)) {
    return done(input, input, input, input);
  }
  if (Array.isArray(input)) {
    return fromArray(CssEdges.toArray(input));
  }
  return {};
}

/**
 * Value wrangling helpers.
 */
export const WrangleEdge = {
  absolute(style: t.Style.Value): t.Style.Props {
    if (style.Absolute === undefined) return style;
    const props = toEdges(style.Absolute);
    const res: t.Style.Props = { ...style, position: 'absolute', ...props };
    delete (res as any).Absolute;
    return res;
  },

  margin(style: t.Style.Value): t.Style.Props {
    return mutateEdge(style, 'Margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft');
  },
  marginX(style: t.Style.Value): t.Style.Props {
    const Margin = CssEdges.toArrayX(style.MarginX);
    return WrangleEdge.margin({ ...style, Margin, MarginX: undefined });
  },
  marginY(style: t.Style.Value): t.Style.Props {
    const Margin = CssEdges.toArrayY(style.MarginY);
    return WrangleEdge.margin({ ...style, Margin, MarginY: undefined });
  },

  padding(style: t.Style.Value): t.Style.Props {
    return mutateEdge(
      style,
      'Padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
    );
  },
  paddingX(style: t.Style.Value): t.Style.Props {
    const Padding = CssEdges.toArrayX(style.PaddingX);
    return WrangleEdge.padding({ ...style, Padding, PaddingX: undefined });
  },
  paddingY(style: t.Style.Value): t.Style.Props {
    const Padding = CssEdges.toArrayY(style.PaddingY);
    return WrangleEdge.padding({ ...style, Padding, PaddingY: undefined });
  },
} as const;

/**
 * Helpers
 */
function isEdgeValue(input: any): input is N {
  return Is.num(input) || Is.str(input);
}

function mutateEdge(
  style: t.Style.Value,
  tmplKey: keyof t.CssTmpl.Templates,
  topKey: K | null,
  rightKey: K | null,
  bottomKey: K | null,
  leftKey: K | null,
): t.Style.Props {
  if (style[tmplKey] === undefined) return style;
  const props = toEdges(style[tmplKey], (e) => {
    const { edge } = e.current;
    if (edge === 'top') e.changeField(topKey);
    if (edge === 'right') e.changeField(rightKey);
    if (edge === 'bottom') e.changeField(bottomKey);
    if (edge === 'left') e.changeField(leftKey);
  });
  const res = { ...style, ...props };
  delete res[tmplKey];
  return Delete.undefined(res);
}
