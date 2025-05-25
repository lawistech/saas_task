import { EnvironmentConfigService } from '../app/core/config/environment.config';

const config = EnvironmentConfigService.initialize();

export const environment = {
  production: false, // Always false for development
  apiUrl: config.apiUrl
};
