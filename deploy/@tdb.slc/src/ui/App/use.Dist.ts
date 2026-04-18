import { useDist as useBase } from '@sys/ui-react';
import { useEffect } from 'react';
import { type t, pkg } from './common.ts';

export function useDist(state?: t.AppSignals) {
  const dist = useBase({ sampleFallback: true });

  /**
   * Effect: update app state-model.
   */
  useEffect(() => {
    if (dist.json) console.info(`💦 ${pkg.name}@${pkg.version}: dist.json →`, dist.json);
    if (state) state.props.dist.value = dist.json;
  }, [!!state, dist.count]);

  // Finish up.
  return dist;
}
