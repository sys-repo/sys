import { Cell } from '@sys/cell';

const cell = await Cell.load('./-sample/cell.stripe');
const started = await Cell.start(cell);

try {
  await Cell.Services.wait(started);
} finally {
  await started.close();
}
