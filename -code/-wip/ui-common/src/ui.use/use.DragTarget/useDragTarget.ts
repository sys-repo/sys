import { useEffect, useRef, useState } from 'react';
import { DEFAULTS, type t } from './common.ts';
import { readDropEvent } from './u.ts';

type H = HTMLElement;
type Div = HTMLDivElement;
type Input<T extends H> = Partial<t.DragTargetHookArgs<T>> | t.DragTargetDropHandler;

/**
 * Provides hooks for treating a DIV element as a "drag-n-drop" target.
 */
export function useDragTarget<T extends H = Div>(input?: Input<T>): t.DragTargetHook<T> {
  const args = wrangle<T>(useRef<T>(null), input);
  const {
    ref,
    onDrop,
    enabled = DEFAULTS.enabled,
    suppressGlobal = DEFAULTS.suppressGlobal,
  } = args;

  const [isDragOver, setDragOver] = useState<boolean>(false);
  const [dropped, setDropped] = useState<t.Dropped | undefined>();

  const changeDragOver = (isOver: boolean) => {
    setDragOver((prev: boolean) => {
      if (isOver !== prev) args.onDragOver?.({ isOver });
      return isOver;
    });
  };

  const reset = () => {
    changeDragOver(false);
    setDropped(undefined);
  };

  useEffect(() => {
    const el = ref.current as HTMLElement;
    let count = 0;

    const dragHandler = (fn?: (e: Event) => void) => {
      return (e: Event) => {
        if (!enabled) return;
        fn?.(e);
        e.preventDefault();
        changeDragOver(count > 0);
      };
    };

    const handleDragEnter = dragHandler(() => count++);
    const handleDragOver = dragHandler(() => (count = count === 0 ? 1 : count));
    const handleDragLeave = dragHandler(() => count--);
    const handleMouseLeave = dragHandler(() => (count = 0));

    const handleDrop = async (e: DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      changeDragOver(false);
      count = 0;
      const { files, urls } = await readDropEvent(e);
      const dropped: t.Dropped = {
        files,
        urls,
        toFiles: () => files.map((item) => item.toFile()),
      };
      setDropped(dropped);
      onDrop?.(dropped);
    };

    const handleGlobalDrop = (e: Event) => {
      if (!enabled) return;
      e.preventDefault(); // Suppress dropping outside the target.
    };

    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('drop', handleDrop);
    if (suppressGlobal) {
      document.addEventListener('drop', handleGlobalDrop);
      document.addEventListener('dragover', handleGlobalDrop);
    }

    return () => {
      el.removeEventListener('dragenter', handleDragEnter);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('drop', handleDrop);
      document.removeEventListener('drop', handleGlobalDrop);
      document.removeEventListener('dragover', handleGlobalDrop);
    };
  }, [ref, enabled, suppressGlobal, onDrop]); // eslint-disable-line

  return {
    ref,
    is: {
      enabled,
      over: !!isDragOver,
      dropped: !!dropped,
    },
    dropped,
    reset,
  };
}

/**
 * [Helpers]
 */
function wrangle<T extends HTMLElement>(ref: React.RefObject<T>, input?: Input<T>) {
  if (typeof input === 'function') return { ref, onDrop: input };
  if (input === undefined) return { ref };
  return { ...input, ref: input.ref ?? ref };
}
