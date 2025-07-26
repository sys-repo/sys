import React, { useEffect, useState } from 'react';
import { type t } from './common.ts';

export function useMuted(
  videoRef: React.RefObject<HTMLVideoElement>,
  props: Pick<t.VideoElementProps, 'muted' | 'defaultMuted'>,
) {
  const { defaultMuted = props.muted ?? false } = props;
  const [current, setCurrent] = useState(props.muted ?? defaultMuted ?? false);

  /**
   * Effect: sync prop → state.
   */
  useEffect(() => {
    if (props.muted !== undefined) setCurrent(props.muted);
  }, [props.muted]);

  /**
   * Effect: ensure <video> element reflects state changes.
   */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = current;
  }, [current]);

  /**
   * API:
   */
  return {
    current,
    set: setCurrent,
  } as const;
}
