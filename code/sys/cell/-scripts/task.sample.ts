import { Cell } from '@sys/cell';

const cell = await Cell.load('./-sample/cell.stripe');
const started = await Cell.start(cell);

await Cell.Services.wait(started);
