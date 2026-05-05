import { Cell } from '@sys/cell';

const cell = await Cell.load('./-sample/cell.stripe');
const runtime = await Cell.Runtime.start(cell);

await Cell.Runtime.wait(runtime);
