import { Fragment } from 'react';
import { type t } from './common.ts';

export const ReactString: t.ReactStringLib = {
  break(text: string) {
    return text
      .trim()
      .split('\n')
      .map((line, index, array) => {
        const isLast = index === array.length - 1;
        return (
          <Fragment key={index}>
            <span>{line.trim()}</span>
            {!isLast && <br />}
          </Fragment>
        );
      });
  },
};
