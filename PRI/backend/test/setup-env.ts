process.env.USOS_API_BASE_URL ??= 'https://usosapps.amu.edu.pl';
process.env.USOS_CONSUMER_KEY ??= 'test-consumer-key';
process.env.USOS_CONSUMER_SECRET ??= 'test-consumer-secret';
process.env.USOS_CALLBACK_URL ??=
  'http://localhost:8090/api/auth/usos/callback';
process.env.FRONTEND_URL ??= 'http://localhost:8090';
process.env.SESSION_SECRET ??= 'test-session-secret-that-is-long-enough';
process.env.DB_HOST ??= '127.0.0.1';
process.env.DB_PORT ??= '5432';
process.env.DB_USER ??= process.env.USER ?? 'postgres';
process.env.DB_PASSWORD ??= '';
process.env.DB_DATABASE ??= 'pri_test';
