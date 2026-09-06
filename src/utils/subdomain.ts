// Known application domains
const MAIN_DOMAINS = ['vtrinebio.site', 'localhost', 'lovable.app'];

// Reserved paths that should not be treated as usernames
const RESERVED_PATHS = ['admin', 'editor', 'auth', 'design', 'api'];

/**
 * Extract subdomain from current hostname
 * Returns null if on main domain or invalid subdomain
 */
export function extractSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Check each known domain
  for (const domain of MAIN_DOMAINS) {
    if (hostname.endsWith(domain) && hostname !== domain && hostname !== `www.${domain}`) {
      const subdomain = hostname.replace(`.${domain}`, '');
      
      // Ignore 'www' as a valid user subdomain
      if (subdomain !== 'www' && subdomain.length > 0) {
        return subdomain.toLowerCase();
      }
    }
  }
  
  return null;
}

/**
 * Check if current access is via subdomain
 */
export function isSubdomainAccess(): boolean {
  return extractSubdomain() !== null;
}

/**
 * Check if current hostname is the main domain (not a subdomain)
 */
export function isMainDomain(): boolean {
  const hostname = window.location.hostname;
  
  for (const domain of MAIN_DOMAINS) {
    if (hostname === domain || hostname === `www.${domain}`) {
      return true;
    }
  }
  
  // Check for preview URLs (contains -preview--) which should be treated as main domain
  if (hostname.includes('-preview--') && hostname.endsWith('.lovable.app')) {
    return true;
  }
  
  return false;
}

/**
 * Build subdomain URL for a given username
 */
export function buildSubdomainUrl(username: string): string {
  const protocol = window.location.protocol;
  return `${protocol}//${username.toLowerCase()}.vtrinebio.site`;
}

/**
 * Check if a path is reserved (not a username)
 */
export function isReservedPath(path: string): boolean {
  const cleanPath = path.replace(/^\//, '').toLowerCase();
  return RESERVED_PATHS.includes(cleanPath);
}

/**
 * Check if we're in development/preview environment
 */
export function isDevelopment(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname.includes('127.0.0.1') || 
         hostname.includes('-preview--') ||
         hostname.endsWith('.lovable.app');
}
