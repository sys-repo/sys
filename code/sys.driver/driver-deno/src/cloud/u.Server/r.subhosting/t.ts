import type { DenoSubhostingAPI as D } from '../common.ts';

export type SubhostingInfo = {
  description: string;
  pkg: { name: string; version: string };
  auth: { identity: string; verified: boolean };
};

export type SubhostingProjectsInfo = {
  projects: D.Project[];
};
