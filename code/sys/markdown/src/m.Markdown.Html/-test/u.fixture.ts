import {
  Forbidden as MarkdownForbidden,
  requireData,
  Sample as MarkdownSample,
} from '../../m.Markdown/-test/u.fixture.ts';

export { requireData };

export const Sample = {
  commonmarkDocument: MarkdownSample.commonmarkDocument,
  gfmTableAndTaskList: MarkdownSample.gfmTableAndTaskList,
  unsafeRawHtml: '<script>alert(1)</script>\n\n<strong onclick="alert(2)">ok</strong>\n',
  unsafeJavascriptLink: '[bad](javascript:alert(1))\n',
} as const;

export const Forbidden = {
  fs: MarkdownForbidden.fs,
  browserAndUi: [...MarkdownForbidden.browserAndUi, 'happy-dom'],
} as const;
