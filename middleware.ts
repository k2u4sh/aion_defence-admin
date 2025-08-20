import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set<string>([
  '/',
  '/signin',
  '/signup',
  '/api/auth/login',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never run middleware on API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('auth_session');

  // If authenticated and requesting public auth pages, send to dashboard
  if (session?.value && (pathname === '/' || pathname === '/signin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!session?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|public).*)'],
};


