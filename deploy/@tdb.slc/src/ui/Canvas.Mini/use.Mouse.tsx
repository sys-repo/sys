import type { t } from './common.ts';

import { useEffect } from 'react';
import { Theme } from './u.ts';

type Options = {
  selected?: t.CanvasPanel;
  over?: t.CanvasPanel;
  theme?: t.CommonTheme;
  onPanelEvent?: t.CanvasPanelEventHandler;
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
  const isSelected = selected === panel;

  useEffect(() => {
    if (!svg.ready) return;

    const query = `#panel\\.${panel}`;
    const svgPanel = svg.query(query);
    const color = Theme.color(theme);

    const updateOpacity = () => {
      const isOver = over === panel;
      const opacity = isSelected ? 1 : isOver ? 0.2 : 0;
      svgPanel?.opacity(opacity);
      svgPanel?.fill(color);
    };

    svg.query('#outline')?.css('pointer-events' as any, 'none'); // NB: Allow click-through of the grid lines that sit above each panel.
    updateOpacity(); // Set default opacity.

    /**
     * Event Handlers.
     */
    const onOver = (isOver: boolean) => {
      updateOpacity();
      onPanelEvent?.({ panel, type: isOver ? 'enter' : 'leave' });
    };
    svgPanel?.off();
    svgPanel?.on('mouseover', () => onOver(true));
    svgPanel?.on('mouseleave', () => onOver(false));
    svgPanel?.on('mousedown', () => onPanelEvent?.({ panel, type: 'click' }));
  }, [svg.ready, panel, selected, over, theme, isSelected]);
}
