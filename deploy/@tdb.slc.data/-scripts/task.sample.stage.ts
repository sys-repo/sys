import { SlcDataPipeline } from '@tdb/slc-data/fs';

const source = `/Users/phil/code/org.tdb/slc-knowledgebase/docs/slc-knowledge/agent-content/venture-example-libraries`;
const target = './.tmp/staging.sample';

const result = await SlcDataPipeline.stageFolder({ source, target });
console.info(result);
