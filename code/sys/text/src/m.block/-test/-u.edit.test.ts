import { describe, expect, it } from '../../-test.ts';
import { TextUpdate } from '../../m.update/mod.ts';
import { TextBlock } from '../mod.ts';
import { D } from './common.ts';

const markers = D.markers;

describe('TextBlock.edit', () => {
  it('edits present content through TextUpdate.lines', () => {
    const before = TextBlock.render({ markers, lines: ['old'] });
    const res = TextBlock.edit({
      text: before,
      markers,
      edit: ({ content }) => {
        return TextUpdate.lines(content, (line) => {
          if (line.text === 'old') return line.replace('new');
        }, { newline: 'preserve', eof: 'preserve' });
      },
    });

    expect(res.kind).to.eql('replace');
    expect(res.after).to.eql(TextBlock.render({ markers, lines: ['new'] }));
  });

  it('fails safely when an inner TextUpdate result fails', () => {
    const before = TextBlock.render({ markers, lines: ['body'] });
    const failed = TextUpdate.apply('👋', [TextUpdate.insert(1, 'x')]);
    const res = TextBlock.edit({ text: before, markers, edit: () => failed });

    expect(res.kind).to.eql('invalid');
    expect(res.changed).to.eql(false);
    expect(res.after).to.eql(before);
    expect(res.error?.reason).to.eql('split-surrogate-pair');
  });

  it('handles missing blocks and string or undefined edit results', () => {
    const ignored = TextBlock.edit({ text: 'plain', markers, edit: () => 'next' });
    expect(ignored.kind).to.eql('unchanged');
    expect(ignored.after).to.eql('plain');

    const added = TextBlock.edit({ text: 'plain', markers, onMissing: 'add', edit: () => 'next' });
    expect(added.kind).to.eql('add');
    expect(added.after).to.eql(`plain\n${TextBlock.render({ markers, content: 'next' })}`);

    const empty = TextBlock.edit({ text: '', markers, onMissing: 'add', edit: () => undefined });
    expect(empty.kind).to.eql('add');
    expect(empty.after).to.eql(TextBlock.render({ markers, content: '' }));
  });
});
