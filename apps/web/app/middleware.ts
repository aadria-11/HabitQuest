import { auth } from '@/lib/auth';

export const middleware = auth(async (req) => {
  if (!req.auth) {
    return Response.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!login|auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
