import { validateEnvironment } from './environment.validation';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/schoolpilot',
  JWT_ACCESS_SECRET: 'a-test-access-secret-that-is-longer-than-32-characters',
  JWT_REFRESH_SECRET: 'a-test-refresh-secret-that-is-longer-than-32-characters',
});

describe('validateEnvironment', () => {
  it('accepts PostgreSQL and JWT configuration and applies token lifetime defaults', () => {
    const environment = validEnvironment();

    expect(validateEnvironment(environment)).toMatchObject({
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
    });
  });

  it('rejects missing database configuration', () => {
    const environment = validEnvironment();
    delete environment.DATABASE_URL;

    expect(() => validateEnvironment(environment)).toThrow(
      'Set DATABASE_URL or SUPABASE_DB_HOST/DB_HOST',
    );
  });

  it('rejects matching JWT secrets', () => {
    const environment = validEnvironment();
    environment.JWT_REFRESH_SECRET = environment.JWT_ACCESS_SECRET;

    expect(() => validateEnvironment(environment)).toThrow(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  });

  it('requires production storage, mail, and frontend configuration', () => {
    const environment = validEnvironment();
    environment.NODE_ENV = 'production';
    environment.JWT_ACCESS_SECRET =
      'production-access-secret-with-over-32-characters';
    environment.JWT_REFRESH_SECRET =
      'production-refresh-secret-with-over-32-characters';

    expect(() => validateEnvironment(environment)).toThrow(
      'Missing required environment variable: FRONTEND_URL',
    );
  });

  it('accepts a fully configured production environment', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment(),
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'production-access-secret-with-over-32-characters',
      JWT_REFRESH_SECRET: 'production-refresh-secret-with-over-32-characters',
      FRONTEND_URL: 'https://schoolpilot.app',
      CORS_ALLOWED_ORIGINS: 'https://admin.schoolpilot.app',
      CLOUDINARY_CLOUD_NAME: 'schoolpilot',
      CLOUDINARY_API_KEY: 'cloudinary-api-key-placeholder',
      CLOUDINARY_API_SECRET: 'cloudinary-api-secret-placeholder',
      RESEND_API_KEY: 'resend-api-key-placeholder',
    };

    expect(validateEnvironment(environment)).toBe(environment);
  });

  it('rejects non-origin production CORS values', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment(),
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'production-access-secret-with-over-32-characters',
      JWT_REFRESH_SECRET: 'production-refresh-secret-with-over-32-characters',
      FRONTEND_URL: 'https://schoolpilot.app',
      CORS_ALLOWED_ORIGINS: 'https://admin.schoolpilot.app/settings',
      CLOUDINARY_CLOUD_NAME: 'schoolpilot',
      CLOUDINARY_API_KEY: 'cloudinary-api-key-placeholder',
      CLOUDINARY_API_SECRET: 'cloudinary-api-secret-placeholder',
      RESEND_API_KEY: 'resend-api-key-placeholder',
    };

    expect(() => validateEnvironment(environment)).toThrow(
      'CORS_ALLOWED_ORIGINS entries must be HTTPS origins',
    );
  });
});
