import { Log } from '@sys/std/log';
const log = Log.category('Foobar');

log('👋 Hello');
log.sub('tmp')('🌳');
