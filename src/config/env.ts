export interface Env {
  DATABASE_URL: string;
  SPREADSHEET_ID: string;
  APPS_SCRIPT_URL: string;
  BRIDGE_SECRET: string;
  BATCH_SIZE: number;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  GOOGLE_TIMEOUT: number;
}

class EnvManager {
  private static instance: EnvManager;
  private _env: Env;

  private constructor() {
    this._env = {
      BATCH_SIZE: Number(process.env.BATCH_SIZE) || 500,
      DATABASE_URL: this.getEnv('DATABASE_URL'),
      SPREADSHEET_ID: this.getEnv('SPREADSHEET_ID'),
      APPS_SCRIPT_URL: this.getEnv('APPS_SCRIPT_URL'),
      BRIDGE_SECRET: process.env.BRIDGE_SECRET || 'changeme',
      PORT: Number(process.env.PORT) || 8080,
      NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) || 'development',
      GOOGLE_TIMEOUT: Number(process.env.GOOGLE_TIMEOUT) || 120000,
    };
  }

  private getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`❌ Missing environment variable: ${key}`);
    }
    return value;
  }

  public static getInstance(): EnvManager {
    if (!EnvManager.instance) {
      EnvManager.instance = new EnvManager();
    }
    return EnvManager.instance;
  }

  get data(): Env {
    return this._env;
  }
}

export const env = EnvManager.getInstance().data;
