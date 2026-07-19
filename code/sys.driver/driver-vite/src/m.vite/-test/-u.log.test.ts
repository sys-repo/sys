import { describe, expect, it, stripAnsi } from '../../-test/common.ts';
import { Log } from '../u.log.ts';

describe('Vite.dev log', () => {
  it('renders the options separator as a secondary screen-width dashed rule', () => {
    const text = stripAnsi(Log.Help.toString({
      pkg: { name: '@sys/example', version: '0.0.0' },
      paths: {
        cwd: '/tmp/pkg',
        app: { entry: 'src/index.html', outDir: 'dist', base: './' },
      },
      url: 'http://localhost:1234/',
    }));

    const lines = text.split('\n');
    const infoLineIndex = lines.findIndex((line) => line.startsWith('━'));
    const optionsLineIndex = lines.findIndex((line) => line === 'options:');

    expect(infoLineIndex).to.not.eql(-1);
    expect(optionsLineIndex).to.not.eql(-1);
    expect(lines[optionsLineIndex + 1]).to.eql('┄'.repeat(lines[infoLineIndex].length));
  });
});
