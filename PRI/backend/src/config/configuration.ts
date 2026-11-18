export interface AppConfiguration {
  port: number;
  frontendUrl: string;
  cookiesSecure: boolean;
  sessionSecret: string;
  sessionTtlSeconds: number;
  usos: {
    baseUrl: string;
    consumerKey: string;
    consumerSecret: string;
    callbackUrl: string;
    scopes: string;
  };
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export default (): AppConfiguration => ({
  port: Number(process.env.PORT ?? 3000),
  frontendUrl: stripTrailingSlash(process.env.FRONTEND_URL),
  cookiesSecure: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET,
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 86400),
  usos: {
    baseUrl: stripTrailingSlash(process.env.USOS_API_BASE_URL),
    consumerKey: process.env.USOS_CONSUMER_KEY,
    consumerSecret: process.env.USOS_CONSUMER_SECRET,
    callbackUrl: process.env.USOS_CALLBACK_URL,
    scopes: process.env.USOS_SCOPES ?? '',
  },
});
