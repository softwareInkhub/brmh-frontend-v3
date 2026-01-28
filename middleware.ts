import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

// Get auth URL from environment variable with fallback logic
// Priority: .env > default localhost:3000 (auth app)
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';

export function middleware(req: NextRequest) {
  const { pathname, href } = req.nextUrl;

  // Allow public files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // For localhost development, skip auth redirect (auth will be handled client-side)
  const hostname = req.nextUrl.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname?.startsWith('localhost:') || hostname?.startsWith('127.0.0.1:');
  if (isLocalhost) {
    console.log('[Middleware] Localhost detected, skipping auth redirect (client-side auth will handle)');
    return NextResponse.next();
  }

  // Check for auth token in cookies (for production)
  const idToken = req.cookies.get('id_token')?.value;
  const accessToken = req.cookies.get('access_token')?.value;
  
  if (idToken || accessToken) {
    console.log('[Middleware] User authenticated, allowing access');
    return NextResponse.next();
  }

  // Avoid redirect loops for callback routes
  if (pathname.startsWith('/callback') || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Redirect to auth page with return URL (production only)
  const nextUrl = encodeURIComponent(href);
  console.log('[Middleware] No auth token found, redirecting to auth page');
  return NextResponse.redirect(`${AUTH_URL}/login?next=${nextUrl}`);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};