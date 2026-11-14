type ImagePolicyEnvironment = {
  apiUrl?: string;
  isolatedPreview?: boolean;
};

type RemoteImagePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  port: string;
  pathname: '/**';
};

const TRUSTED_IMAGE_ORIGINS = [
  'https://raw.githubusercontent.com',
  'https://seungwoo.i234.me',
  'https://api.seungwoo.i234.me',
];
const RASTER_IMAGE_PATH = /\.(?:jpe?g|png|webp|avif)$/i;

function currentEnvironment(): ImagePolicyEnvironment {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    isolatedPreview: process.env.NEXT_PUBLIC_ISOLATED_PREVIEW === '1',
  };
}

function remotePattern(value: string, allowLoopback: boolean): RemoteImagePattern | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    const loopback = url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || /^127\./.test(url.hostname) || url.hostname === '[::1]' || url.hostname === '0.0.0.0';
    if (loopback && (!allowLoopback || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) return null;
    // Environment values must never introduce hostname glob patterns.
    if (!/^[a-z\d.-]+$/i.test(url.hostname) && !(allowLoopback && url.hostname === '[::1]')) return null;
    return {
      protocol: url.protocol === 'https:' ? 'https' : 'http',
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

export function getImageRemotePatterns(environment = currentEnvironment()): RemoteImagePattern[] {
  const patterns = TRUSTED_IMAGE_ORIGINS.map(origin => remotePattern(origin, false)!);
  const apiPattern = environment.apiUrl ? remotePattern(environment.apiUrl, environment.isolatedPreview === true) : null;
  if (apiPattern && !patterns.some(pattern => pattern.protocol === apiPattern.protocol && pattern.hostname === apiPattern.hostname && pattern.port === apiPattern.port)) {
    patterns.push(apiPattern);
  }
  return patterns;
}

/** Keep unsupported or untrusted sources on their existing direct browser URL. */
export function shouldBypassImageOptimization(src: string, environment = currentEnvironment()): boolean {
  if (!src || src !== src.trim() || src.length > 3072 || src.includes('\\')) return true;
  const local = src.startsWith('/') && !src.startsWith('//');
  try {
    const url = local ? new URL(src, 'https://local-image.invalid') : new URL(src);
    if (!RASTER_IMAGE_PATH.test(url.pathname) || url.username || url.password) return true;
    if (local) return /\/_next\/image($|\/)/.test(decodeURIComponent(url.pathname));
    return !getImageRemotePatterns(environment).some(pattern =>
      `${pattern.protocol}:` === url.protocol && pattern.hostname === url.hostname && pattern.port === url.port
    );
  } catch {
    return true;
  }
}
