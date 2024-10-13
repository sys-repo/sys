import type * as t from './t.ts';
import { BroadcastChannelNetworkAdapter } from './libs.automerge-repo.ts';

export const BroadcastChannel = {
  create(): t.NetworkAdapterInterface {
    /**
     * NOTE: Type hack - required to pass into Repo
     *       as of [Automerge-Repo:1.2.0].
     */
    return new BroadcastChannelNetworkAdapter() as unknown as t.NetworkAdapterInterface;
  },
} as const;
