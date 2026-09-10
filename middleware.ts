// middleware.ts
import { next } from '@vercel/functions';

const ROOT_DOMAIN = 'vtrine.bio';

// Subdomínios que NÃO são loja de um usuário (ajuste conforme precisar)
const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api'];

export const config = {
  matcher: ['/((?!api|assets|favicon.ico|robots.txt|sitemap.xml).*)'],
};

export default function middleware(request: Request) {
  const hostname = (request.headers.get('host') || '').split(':')[0];

  const isRootDomain =
    hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`;

  // Domínio raiz, localhost, preview da Vercel etc: segue normal
  if (isRootDomain || !hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return next();
  }

  const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, '');

  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return next();
  }

  // Repassa o subdomínio como header pra quem precisar dele
  // no backend/edge (ex: função de OG image por lojista)
  const headers = new Headers(request.headers);
  headers.set('x-tenant-subdomain', subdomain);

  return next({
    request: { headers },
  });
}
