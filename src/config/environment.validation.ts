const requiredValue = (
  environment: NodeJS.ProcessEnv,
  name: string,
): string => {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  environment[name] = value;
  return value;
};

const validateDatabaseConfiguration = (
  environment: NodeJS.ProcessEnv,
): void => {
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (databaseUrl) {
    environment.DATABASE_URL = databaseUrl;
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
    }
    if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
      throw new Error(
        'DATABASE_URL must use the postgres or postgresql protocol',
      );
    }
    return;
  }

  const databaseFields = [
    ['SUPABASE_DB_HOST', 'DB_HOST'],
    ['SUPABASE_DB_USER', 'DB_USER'],
    ['SUPABASE_DB_PASSWORD', 'DB_PASSWORD'],
    ['SUPABASE_DB_NAME', 'DB_NAME'],
  ];
  databaseFields.forEach(([preferredName, fallbackName]) => {
    const configuredValue =
      environment[preferredName]?.trim() || environment[fallbackName]?.trim();
    if (!configuredValue) {
      throw new Error(
        `Set DATABASE_URL or ${preferredName}/${fallbackName} for every PostgreSQL field`,
      );
    }
  });

  const port = environment.SUPABASE_DB_PORT || environment.DB_PORT;
  if (
    port &&
    (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
  ) {
    throw new Error('SUPABASE_DB_PORT/DB_PORT must be a valid TCP port');
  }
};

export const validateEnvironment = (
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv => {
  const isProduction =
    environment.NODE_ENV === 'production' ||
    environment.VERCEL_ENV === 'production';
  validateDatabaseConfiguration(environment);

  const accessSecret = requiredValue(environment, 'JWT_ACCESS_SECRET');
  const refreshSecret = requiredValue(environment, 'JWT_REFRESH_SECRET');
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters',
    );
  }
  if (accessSecret === refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  }

  environment.JWT_ACCESS_EXPIRES ||= '15m';
  environment.JWT_REFRESH_EXPIRES ||= '7d';

  if (isProduction) {
    if (environment.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
      throw new Error(
        'Production PostgreSQL connections must verify TLS certificates',
      );
    }

    if (
      [accessSecret, refreshSecret].some(
        (secret) =>
          secret.startsWith('replace-with-') ||
          secret.includes('test-only') ||
          secret.startsWith('schoolpilot-ci-'),
      )
    ) {
      throw new Error(
        'Production JWT secrets must not be example or test values',
      );
    }

    const frontendUrl = requiredValue(environment, 'FRONTEND_URL');
    try {
      const parsedFrontendUrl = new URL(frontendUrl);
      if (
        parsedFrontendUrl.protocol !== 'https:' ||
        parsedFrontendUrl.origin !== frontendUrl.replace(/\/$/, '')
      ) {
        throw new Error('FRONTEND_URL must be an HTTPS origin in production');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTPS origin'))
        throw error;
      throw new Error('FRONTEND_URL must be a valid HTTPS origin');
    }

    requiredValue(environment, 'CLOUDINARY_CLOUD_NAME');
    requiredValue(environment, 'CLOUDINARY_API_KEY');
    requiredValue(environment, 'CLOUDINARY_API_SECRET');
    requiredValue(environment, 'RESEND_API_KEY');

    (environment.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => {
        try {
          const parsedOrigin = new URL(origin);
          if (
            parsedOrigin.protocol !== 'https:' ||
            parsedOrigin.origin !== origin
          ) {
            throw new Error(
              'CORS_ALLOWED_ORIGINS entries must be HTTPS origins',
            );
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('HTTPS'))
            throw error;
          throw new Error(
            'CORS_ALLOWED_ORIGINS entries must be valid HTTPS origins',
          );
        }
      });
  }

  return environment;
};
