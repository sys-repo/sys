import { Octokit } from '@octokit/rest';

/** Internal Octokit substrate types, owned by upstream @octokit/rest declarations. */
export declare namespace GithubOctokit {
  export type Client = InstanceType<typeof Octokit>;
}
