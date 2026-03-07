import { useCallback, useState } from 'react';
import type { t } from './common.ts';

export function useBrowserController(
  args: t.Dist.Browser.Controller.Args = {},
): t.Dist.Browser.Controller.Instance {
  const {
    selectedPath: controlledPath,
    onSelect: externalOnSelect,
    filterText: controlledFilterText,
    onFilter: externalOnFilter,
  } = args;

  const isPathControlled = controlledPath !== undefined;
  const isFilterControlled = controlledFilterText !== undefined;

  const [path, setPath] = useState<t.StringPath | undefined>(() => controlledPath);
  const [filter, setFilter] = useState<string | undefined>(() => controlledFilterText);

  const selectedPath = isPathControlled ? controlledPath : path;
  const filterText = isFilterControlled ? controlledFilterText : filter;

  const onSelect = useCallback<t.DistBrowserSelectHandler>(
    (e) => {
      if (!isPathControlled) setPath(e.path);
      externalOnSelect?.(e);
    },
    [isPathControlled, externalOnSelect],
  );

  const onFilter = useCallback<t.DistBrowserFilterHandler>(
    (e) => {
      if (!isFilterControlled) setFilter(e.text);
      externalOnFilter?.(e);
    },
    [isFilterControlled, externalOnFilter],
  );

  /**
   * API
   */
  return {
    selectedPath,
    filterText,
    onFilter,
    onSelect,
  };
}
