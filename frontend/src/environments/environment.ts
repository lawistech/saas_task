import { EnvironmentConfigService } from '../app/core/config/environment.config';

const config = EnvironmentConfigService.initialize();

export const environment = {
  production: config.production,
  apiUrl: config.apiUrl
};
