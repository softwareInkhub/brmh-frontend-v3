import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname, href } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const idToken = req.cookies.get('id_token')?.value;
  if (idToken) {
    return NextResponse.next();
  }

  // Avoid loops if you ever add a local callback route
  if (pathname.startsWith('/callback')) {
    return NextResponse.next();
  }

  const nextUrl = encodeURIComponent(href);
  return NextResponse.redirect(`https://auth.brmh.in/login?next=${nextUrl}`);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/public).*)'],
};