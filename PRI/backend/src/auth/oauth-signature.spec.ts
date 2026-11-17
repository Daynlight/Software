import {
  createOAuthAuthorizationHeader,
  createSignatureBaseString,
  percentEncode,
  signHmacSha1,
} from './oauth-signature';

const request = {
  method: 'GET',
  url: 'http://photos.example.net/photos?file=vacation.jpg&size=original',
  consumerKey: 'dpf43f3p2l4k3l03',
  consumerSecret: 'kd94hf93k423kf44',
  token: 'nnch734d00sl2jdk',
  tokenSecret: 'pfkkdhi9sl3r4s00',
  nonce: 'kllo9940pd9333jh',
  timestamp: '1191242096',
};

describe('percentEncode', () => {
  it('encodes characters outside the RFC 3986 unreserved set', () => {
    expect(percentEncode("a b!c*d'e(f)g")).toBe('a%20b%21c%2Ad%27e%28f%29g');
  });

  it('keeps unreserved characters untouched', () => {
    expect(percentEncode('AZaz09-._~')).toBe('AZaz09-._~');
  });

  it('encodes unicode characters as UTF-8', () => {
    expect(percentEncode('żółć')).toBe('%C5%BC%C3%B3%C5%82%C4%87');
  });
});

describe('createSignatureBaseString', () => {
  it('builds the base string from the reference OAuth 1.0a example', () => {
    expect(createSignatureBaseString(request)).toBe(
      'GET&http%3A%2F%2Fphotos.example.net%2Fphotos&file%3Dvacation.jpg%26oauth_consumer_key%3Ddpf43f3p2l4k3l03%26oauth_nonce%3Dkllo9940pd9333jh%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1191242096%26oauth_token%3Dnnch734d00sl2jdk%26oauth_version%3D1.0%26size%3Doriginal',
    );
  });

  it('includes additional request parameters and omits an absent token', () => {
    const baseString = createSignatureBaseString({
      ...request,
      token: undefined,
      tokenSecret: undefined,
      extraParams: { scopes: 'email|studies', oauth_callback: 'oob' },
    });

    expect(baseString).toContain(
      'oauth_callback%3Doob%26oauth_consumer_key%3Ddpf43f3p2l4k3l03',
    );
    expect(baseString).toContain('scopes%3Demail%257Cstudies');
    expect(baseString).not.toContain('oauth_token%3D');
  });

  it('orders parameters by encoded key and value', () => {
    const baseString = createSignatureBaseString({
      ...request,
      url: 'https://example.com/services/users/user?fields=id',
      token: undefined,
      extraParams: { a: '2', b: '1', A: '1' },
    });

    const encodedParameters = baseString.split('&').at(-1) as string;
    expect(decodeURIComponent(encodedParameters)).toBe(
      'A=1&a=2&b=1&fields=id&oauth_consumer_key=dpf43f3p2l4k3l03&oauth_nonce=kllo9940pd9333jh&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1191242096&oauth_version=1.0',
    );
  });
});

describe('signHmacSha1', () => {
  it('matches the reference signature', () => {
    expect(
      signHmacSha1(
        createSignatureBaseString(request),
        request.consumerSecret,
        request.tokenSecret,
      ),
    ).toBe('tR3+Ty81lMeYAr/Fid0kMTYa/WM=');
  });

  it('uses an empty token secret when no token is present', () => {
    const baseString = createSignatureBaseString({
      ...request,
      token: undefined,
      tokenSecret: undefined,
    });

    expect(signHmacSha1(baseString, request.consumerSecret)).not.toBe('');
  });
});

describe('createOAuthAuthorizationHeader', () => {
  it('signs the request and returns an encoded OAuth header', () => {
    const header = createOAuthAuthorizationHeader(request);

    expect(header.startsWith('OAuth ')).toBe(true);
    expect(header).toContain('oauth_consumer_key="dpf43f3p2l4k3l03"');
    expect(header).toContain('oauth_nonce="kllo9940pd9333jh"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(header).toContain('oauth_timestamp="1191242096"');
    expect(header).toContain('oauth_version="1.0"');
    expect(header).toContain('oauth_token="nnch734d00sl2jdk"');
    expect(header).toContain(
      'oauth_signature="tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D"',
    );
  });

  it('signs requests that carry body parameters', () => {
    const header = createOAuthAuthorizationHeader({
      ...request,
      method: 'POST',
      url: 'https://example.com/services/oauth/request_token',
      token: undefined,
      tokenSecret: undefined,
      extraParams: { oauth_callback: 'oob' },
    });

    expect(header).toContain('oauth_signature=');
    expect(header).not.toContain('oauth_token=');
  });
});
