import { type t, Is } from './common.ts';

// Matches alias keys like:
//    :index
//    :core-videos
//    :p2p-data3
//    :assets-2025
const ALIAS_KEY = /^:([a-z0-9]+(-[a-z0-9]+)*)$/;

export const AliasIs: t.AliasResolverIsLib = {
  aliasKey(input?: unknown): input is t.Alias.Key {
    return Is.string(input) && ALIAS_KEY.test(input);
  },
};
