import type { t } from './common.ts';
import type * as TInfo from './t.info.ts';
import type * as TSwitch from './t.switch.ts';

/**
 * CRDT repository UI contracts.
 */
export declare namespace Repo {
  /** UI tools for representing a CRDT repository. */
  export type Lib = {
    readonly Info: t.FC<Info.Props>;
    readonly SyncSwitch: t.FC<SyncSwitch.Props>;
    readonly StatusBullet: t.FC<StatusBullet.Props>;
  };

  /** Consolidated derived connection state for the repo info panel. */
  export type Status = {
    /** High-level connection state derived from syncEnabled and peers. */
    readonly status: 'offline' | 'connecting' | 'online';
    /** True once the repo has emitted its initial props/snapshot. */
    readonly ready: boolean;
    /** Whether sync is currently enabled for this repo. */
    readonly syncEnabled: boolean;
    /** True when at least one sync peer is connected. */
    readonly hasPeers: boolean;
    /** True when the repo is configured with at least one sync server URL. */
    readonly hasServers: boolean;
  };

  /**
   * Repository info component contracts.
   */
  export namespace Info {
    /** Props accepted by the repository info component. */
    export type Props = TInfo.Props;
  }

  /**
   * Repository status-bullet component contracts.
   */
  export namespace StatusBullet {
    /** Props accepted by the repository status-bullet component. */
    export type Props = TInfo.StatusBulletProps;
  }

  /**
   * Repository sync-switch component contracts.
   */
  export namespace SyncSwitch {
    /** Props accepted by the repository sync-switch component. */
    export type Props = TSwitch.Props;
  }
}
