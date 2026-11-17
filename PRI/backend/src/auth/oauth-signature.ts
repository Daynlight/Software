import { createHmac } from 'node:crypto';

const SIGNATURE_METHOD = 'HMAC-SHA1';
const OAUTH_VERSION = '1.0';

export interface OAuthRequestOptions {
  method: string;
  url: string;
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
  nonce: string;
  timestamp: string;
  extraParams?: Record<string, string>;
}

type OAuthParams = Record<string, string>;

export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function collectOAuthParams(options: OAuthRequestOptions): OAuthParams {
  const params: OAuthParams = {
    ...options.extraParams,
    oauth_consumer_key: options.consumerKey,
    oauth_nonce: options.nonce,
    oauth_signature_method: SIGNATURE_METHOD,
    oauth_timestamp: options.timestamp,
    oauth_version: OAUTH_VERSION,
  };

  if (options.token) {
    params.oauth_token = options.token;
  }

  return params;
}

function normalizeParameters(params: OAuthParams): string {
  return Object.entries(params)
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as const)
    .sort(([leftKey], [rightKey]) => (leftKey < rightKey ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function createSignatureBaseString(
  options: OAuthRequestOptions,
): string {
  const url = new URL(options.url);
  const queryParameters = Object.fromEntries(url.searchParams.entries());
  const parameters = normalizeParameters({
    ...queryParameters,
    ...collectOAuthParams(options),
  });

  return [
    options.method.toUpperCase(),
    percentEncode(`${url.protocol}//${url.host}${url.pathname}`),
    percentEncode(parameters),
  ].join('&');
}

export function signHmacSha1(
  baseString: string,
  consumerSecret: string,
  tokenSecret = '',
): string {
  const key = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  return createHmac('sha1', key).update(baseString).digest('base64');
}

export function createOAuthAuthorizationHeader(
  options: OAuthRequestOptions,
): string {
  const params = collectOAuthParams(options);
  const signature = signHmacSha1(
    createSignatureBaseString(options),
    options.consumerSecret,
    options.tokenSecret,
  );

  const header = Object.entries({ ...params, oauth_signature: signature })
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(', ');

  return `OAuth ${header}`;
}
