import { useEffect } from 'react';
import { type t, ReactEvent } from './common.ts';
import { Theme } from './u.ts';

type Options = {
  selected?: t.CanvasPanel | t.CanvasPanel[];
  over?: t.CanvasPanel;
  theme?: t.CommonTheme;
  onPanelEvent?: t.LogoCanvasPanelHandler;
};

/**
 * Manages mouse behavior on a Canvas.
 */
export function useMouse<T extends HTMLElement>(svg: t.SvgInstance<T>, options: Options = {}) {
  useCanvasPanelMouse('purpose', svg, options);
  useCanvasPanelMouse('customers', svg, options);
  useCanvasPanelMouse('problem', svg, options);
  useCanvasPanelMouse('uvp', svg, options);
  useCanvasPanelMouse('solution', svg, options);
  useCanvasPanelMouse('channels', svg, options);
  useCanvasPanelMouse('revenue', svg, options);
  useCanvasPanelMouse('costs', svg, options);
  useCanvasPanelMouse('metrics', svg, options);
  useCanvasPanelMouse('advantage', svg, options);
  useCanvasPanelMouse('impact', svg, options);
}

/**
 * Manages mouse behavior on an individual Canvas panel.
 */
export function useCanvasPanelMouse<T extends HTMLElement>(
  panel: t.CanvasPanel,
  svg: t.SvgInstance<T>,
  options: Options = {},
) {
  const { selected, over, theme, onPanelEvent } = options;
  const isSelected = wrangle.isSelected(panel, options);

  useEffect(() => {
    if (!svg.ready) return;

    const query = `#panel\\.${panel}`;
    const svgPanel = svg.query(query);
    const color = Theme.color(theme);

    const updateOpacity = () => {
      const opacity = wrangle.selectionOpacity(panel, options);
      svgPanel?.opacity(opacity);
      svgPanel?.fill(color);
    };

    svg.query('#outline')?.css('pointer-events' as any, 'none'); // NB: Allow click-through of the grid lines that sit above each panel.
    updateOpacity(); // Set default opacity.

    /**
     * Event Handlers:
     */
    type E = t.LogoCanvasPanelHandlerArgs;
    const fire = (e: Event, event: E['event']) => {
      const modifier = ReactEvent.modifiers(e);
      onPanelEvent?.({ panel, event, modifier });
    };
    const onOver = (e: Event, isOver: boolean) => {
      updateOpacity();
      fire(e, isOver ? 'enter' : 'leave');
    };

    svgPanel?.off();
    svgPanel?.on('mouseover', (e) => onOver(e, true));
    svgPanel?.on('mouseleave', (e) => onOver(e, false));
    svgPanel?.on('mousedown', (e) => fire(e, 'click'));
  }, [svg.ready, panel, selected, over, theme, isSelected]);
}

/**
 * Helpers:
 */
const wrangle = {
  isSelected(panel: t.CanvasPanel, options: Options) {
    const { selected } = options;
    if (!selected) return false;
    if (Array.isArray(selected)) return selected.includes(panel);
    return selected === panel;
  },

  selectionOpacity(panel: t.CanvasPanel, options: Options = {}): t.Percent {
    const { selected, over } = options;
    const isOver = over === panel;
    const isSelected = wrangle.isSelected(panel, options);
    if (isSelected) {
      const isMultiSelect = Array.isArray(selected);
      return isMultiSelect ? 0.85 : 1;
    } else {
      return isOver ? 0.2 : 0;
    }
  },
} as const;
