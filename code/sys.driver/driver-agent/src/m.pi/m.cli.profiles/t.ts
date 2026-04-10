import type { t } from './common.ts';

/**
 * Persistent launch profiles for Pi CLI.
 */
export declare namespace PiCliProfiles {
  export type Lib = {};

  export namespace Yaml {
    /**
     * YAML document persisted per profile-set file.
     */
    export type ProfileSet = {
      readonly profiles: readonly Profile[];
    };

    /**
     * One named Pi launch profile.
     *
     * These fields map directly to `PiCli.RunArgs`.
     */
    export type Profile = {
      readonly name: string;
      readonly args?: readonly string[];
      readonly read?: readonly t.StringPath[];
      readonly env?: Record<string, string>;
    };
  }
}
