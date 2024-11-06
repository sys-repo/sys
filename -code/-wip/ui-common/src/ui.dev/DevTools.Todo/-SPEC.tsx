import { Dev } from '..';
import { Todo } from '.';

export default Dev.describe('Todo', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    ctx.subject.size([300, null]).render(() => <Todo style={{ margin: 0 }} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools(e);
    dev
      //
      .TODO()
      .TODO('Do this single-line thing')
      .TODO(`**Long** single-line \`thing\`. ${Dev.Lorem.toString()}`).TODO(`

      Multiline *markdown* comments:

      - one
      - two
      - three
    
    `);

    dev.TODO((todo) => todo.style({ color: 'blue' }).text('hello blue (via function)'));

    dev.TODO(`
- [ ] Item 1
- [ ] Item 2        
    `);
  });
});
