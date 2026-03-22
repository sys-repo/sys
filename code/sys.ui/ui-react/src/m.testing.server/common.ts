export { DomMock, Testing } from '@sys/testing/server';
export * from '../common.ts';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
