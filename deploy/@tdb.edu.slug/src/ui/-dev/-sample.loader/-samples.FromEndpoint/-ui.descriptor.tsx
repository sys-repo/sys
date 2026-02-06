import { type t } from './common.ts';

export const DescriptorSample: t.FetchSample = {
  title: 'Descriptor',
  probe(e) {
    return <div>hello</div>;
  },
};
