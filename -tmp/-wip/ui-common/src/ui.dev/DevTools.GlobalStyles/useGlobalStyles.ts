import { useEffect } from 'react';

import { DEFAULTS, Style } from '../common.ts';
import { TodoStyles } from './styles.Todo.ts';

const CLASS = DEFAULTS.md.class;
let _isAdded = false;

/**
 * Hook that adds the global markdown CSS styles (only once).
 */
export function useGlobalStyles() {
  useEffect(() => {
    if (_isAdded) return;
    _isAdded = true;

    Style.global(TodoStyles, { prefix: `.${CLASS.todo}` });
  }, []);

  return { TodoStyles };
}
