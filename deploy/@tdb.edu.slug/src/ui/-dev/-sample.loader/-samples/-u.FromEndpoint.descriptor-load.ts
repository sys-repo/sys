import { type t, SlugClient } from './-common.ts';

export const SampleDescriptor: t.FetchSample = {
  label: 'FromEndpoint.Descriptor.load',

  /**
   * Load descriptor manifest from origin.
   */
  async run(e) {
    const path = e.local ? 'staging/cdn.slc.db.team/kb/-manifests' : 'kb/-manifests';
    const res = await SlugClient.FromEndpoint.Descriptor.load(e.origin.cdn.default, path);
    e.result(res);
  },
};
