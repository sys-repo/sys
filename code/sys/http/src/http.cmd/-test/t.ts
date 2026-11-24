import type { t } from '../../common.ts';

export type FixtureName = 'fixture.echo' | 'fixture.fail' | 'fixture.emit' | 'fixture.ctx';

export type FixturePayload = {
  readonly 'fixture.echo': { readonly text: string; readonly suffix?: string };
  readonly 'fixture.fail': { readonly message: string };
  readonly 'fixture.emit': { readonly text: string };
  readonly 'fixture.ctx': Record<string, never>;
};

export type FixtureResult = {
  readonly 'fixture.echo': { readonly text: string };
  readonly 'fixture.fail': Record<string, never>;
  readonly 'fixture.emit': { readonly ok: true };
  readonly 'fixture.ctx': {
    readonly id: t.Cmd.ReqId;
    readonly name: 'fixture.ctx';
    readonly ns?: t.Cmd.Namespace;
    readonly aborted: boolean;
  };
};

export type FixtureEvent = {
  readonly 'fixture.echo': never;
  readonly 'fixture.fail': never;
  readonly 'fixture.emit': { readonly text: string };
  readonly 'fixture.ctx': never;
};

export type FixtureOptions = t.HttpCmd.HandlerOptions<
  FixtureName,
  FixturePayload,
  FixtureResult,
  FixtureEvent
>;
