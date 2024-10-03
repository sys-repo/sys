import type { DenoSubhostingAPI as D } from '../common.ts';

/**
 * Info response for the "subhosting" deployment cloud.
 */
export type SubhostingInfo = {
  description: string;
  pkg: { name: string; version: string };
  auth: { identity: string; verified: boolean };
};

/**
 * Info about projects within the "subhosting" deployment cloud.
 */
export type SubhostingProjectsInfo = {
  projects: D.Project[];
};
