import { useEffect, useState } from 'react';
import { rx, type t } from '../common.ts';
import { TestPropListController } from '../logic/Controller.ts';

export function useController(args: {
  initial?: t.TestPropListData;
  onChanged?: t.TestPropListChangeHandler;
}) {
  const [data, setData] = useState<t.TestPropListData>();

  /**
   * Lifecycle.
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();

    TestPropListController(args.initial).then((controller) => {
      const update = () => setData(controller.current);
      update();

      const $ = controller.$.pipe(rx.takeUntil(dispose$));
      $.subscribe((e) => {
        args.onChanged?.(e);
        update();
      });
    });

    return dispose;
  }, []);

  /**
   * API
   */
  return { data };
}
