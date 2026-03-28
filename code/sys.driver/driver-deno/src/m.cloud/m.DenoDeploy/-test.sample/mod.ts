import { externalDeployConfig, sampleDeployConfig } from './u.config.ts';
import { createDeployableRepoPkg, prepareStageForCreate, prepareStageForExistingApp } from './u.fixture.ts';

export const Sample = {
  Config: {
    externalDeploy: externalDeployConfig,
    sampleDeploy: sampleDeployConfig,
  },
  Fixture: {
    createDeployableRepoPkg,
  },
  Stage: {
    forCreate: prepareStageForCreate,
    forExistingApp: prepareStageForExistingApp,
  },
} as const;
