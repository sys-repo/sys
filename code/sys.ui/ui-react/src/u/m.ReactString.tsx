import { Fragment } from 'react';
import { type t } from './common.ts';

export const ReactString: t.ReactStringLib = {
  break(input: string | t.ReactNode) {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .split('\n')
      .map((line, index, array) => {
        const isLast = index === array.length - 1;
        const text = line.trim();
        return (
          <Fragment key={index}>
            <span key={text}>{text}</span>
            {!isLast && <br key={`br-${index}`} />}
          </Fragment>
        );
      });
  },
};
