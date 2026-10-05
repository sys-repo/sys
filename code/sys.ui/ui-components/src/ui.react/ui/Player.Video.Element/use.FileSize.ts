import React from 'react';
import { Http, Rx, type t, Url } from './common.ts';

/**
 * Retrieves the byte-size of the media file.
 */
export function useFileSize(href?: t.StringUrl) {
  const [bytes, setBytes] = React.useState(0);

  /**
   * Effect: fetch header information:
   */
  React.useEffect(() => {
    const url = Url.parse(href);
    if (!url.ok) return void setBytes(0);

    const life = Rx.lifecycle();
    Http.Fetch.byteSize(url.href, life).then((e) => setBytes(e.bytes ?? 0));

    return life.dispose;
  }, [href]);

  /**
   * API:
   */
  return { bytes } as const;
}
