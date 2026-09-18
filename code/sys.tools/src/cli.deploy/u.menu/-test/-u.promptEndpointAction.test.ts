import { Cli, describe, expect, it } from '../../../-test.ts';
import {
  formatPreviewActionName,
  formatPushActionName,
  promptEndpointActionWith,
} from '../u/u.promptEndpointAction.ts';
import { renderEndpointScreen } from '../u/u.renderEndpointScreen.ts';

const ENDPOINT_ACTION_ARGS = Object.freeze({
  checkOk: true,
  showPush: false,
  showStagePush: false,
  showPreview: false,
  previewPort: 4040,
  pushedOk: false,
  hashPrefix: '#81960',
  hasStageMeta: false,
});

describe('Deploy: promptEndpointAction', () => {
  it('uses an empty prompt message so the selector renders as bare ?', async () => {
    let message = '<unset>';
    const res = await promptEndpointActionWith(
      ENDPOINT_ACTION_ARGS,
      (args) => {
        message = args.message ?? '';
        return Promise.resolve('back');
      },
    );

    expect(res).to.eql('back');
    expect(message).to.eql('');
  });

  it('rejects a prompt result outside the offered action set', async () => {
    const failure = await promptEndpointActionWith(
      ENDPOINT_ACTION_ARGS,
      () => Promise.resolve('unexpected'),
    ).then(
      () => undefined,
      (cause) => cause,
    );

    expect(failure).to.eql({
      name: 'Error',
      message: 'Unexpected endpoint action: unexpected',
    });
  });

  it('offers preview only when verified authority is present', async () => {
    let actions: string[] = [];
    const capture = (args: { options: { value: string }[] }) => {
      actions = args.options.map((option) => option.value);
      return Promise.resolve('back');
    };

    await promptEndpointActionWith({ ...ENDPOINT_ACTION_ARGS, showPreview: false }, capture);
    expect(actions).to.not.include('preview');

    await promptEndpointActionWith({ ...ENDPOINT_ACTION_ARGS, showPreview: true }, capture);
    expect(actions).to.include('preview');
  });

  it('formats preview action with the default port label', () => {
    const res = formatPreviewActionName(4040);
    expect(Cli.stripAnsi(res)).to.eql('  preview port:4040');
  });

  it('formats preview action with an overridden port label', () => {
    const res = formatPreviewActionName(4041);
    expect(Cli.stripAnsi(res)).to.eql('  preview port:4041');
  });

  it('renders one sanitized verifier reason for unavailable preview', () => {
    const text = Cli.stripAnsi(renderEndpointScreen({
      table: 'endpoint',
      check: { ok: true, doc: { staging: { dir: './staging' } } },
      previewReason: 'unexpected-entry',
    }));

    expect(text).to.include('Preview unavailable');
    expect(text).to.include('reason: unexpected-entry');
    expect(text.split('reason:').length - 1).to.eql(1);
  });

  it('formats pushed action size without staging label', () => {
    const res = formatPushActionName({
      pushedOk: true,
      hashPrefix: '#81960',
      pushElapsed: '507ms',
      pushBytes: 284,
      pushUrl: 'https://example.com',
    });

    expect(Cli.stripAnsi(res)).to.eql(
      '  #81960  pushed ✔ - https://example.com (in 507ms, 284 B)',
    );
  });
});
