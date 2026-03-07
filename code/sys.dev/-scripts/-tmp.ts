import { Log } from '@sys/std/log';
const log = Log.logger('Foobar');

log('👋 Hello');
log.sub('tmp')('🌳');
