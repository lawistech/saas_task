export interface EnvironmentConfig {
  production: boolean;
  apiUrl: string;
}

export class EnvironmentConfigService {
  private static config: EnvironmentConfig;

  static initialize(): EnvironmentConfig {
    if (!this.config) {
      // Use fallback values that can be easily configured
      // In production, these would be replaced by build-time environment variables
      const apiUrl = this.getEnvironmentVariable('API_URL') || 'http://localhost:8000/api';
      const production = this.getEnvironmentVariable('PRODUCTION') === 'true' || false;

      this.config = {
        production,
        apiUrl
      };
    }
    return this.config;
  }

  static getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.initialize();
    }
    return this.config;
  }

  /**
   * Set configuration values programmatically
   * This allows for runtime configuration updates
   */
  static setConfig(config: Partial<EnvironmentConfig>): void {
    if (!this.config) {
      this.initialize();
    }
    this.config = { ...this.config, ...config };
  }

  private static getEnvironmentVariable(key: string): string | undefined {
    // Check for environment variables in different contexts

    // 1. Check window.env (for runtime configuration)
    if (typeof window !== 'undefined' && (window as any).env) {
      return (window as any).env[key];
    }

    // 2. Check process.env (for build-time configuration)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }

    // 3. Try to load from app.config.json as fallback
    try {
      if (typeof window !== 'undefined') {
        // This would be loaded via HTTP request in a real scenario
        // For now, we'll rely on the fallback values
      }
    } catch (error) {
      // Silently fail and use fallback
    }

    return undefined;
  }
}
