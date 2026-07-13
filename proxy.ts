import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyStagingAccess } from "@/lib/deployment";

export async function proxy(request: NextRequest) {
  const isTestAccessEnabled = process.env.PRODUCTION_OS_TEST_ACCESS_ENABLED === "true";
  
  if (isTestAccessEnabled) {
    const { pathname } = request.nextUrl;
    
    // Allow static files, Next.js assets, and auth API routes
    const isPublicAsset = pathname.startsWith('/_next') || 
                          pathname.startsWith('/api/auth/staging') ||
                          pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/);
                          
    if (!isPublicAsset) {
      const isAuthorized = await verifyStagingAccess(request);
      
      if (pathname === "/test-access") {
        if (isAuthorized) {
          // If already authorized and trying to access /test-access, proceed to app (which checks auth)
          return NextResponse.redirect(new URL("/login", request.url));
        }
      } else {
        if (!isAuthorized) {
          // Unauthorised access to app routes -> redirect to /test-access
          return NextResponse.redirect(new URL("/test-access", request.url));
        }
      }
    }
  } else {
    // If test access is disabled, but they try to visit /test-access, redirect to login
    if (request.nextUrl.pathname === "/test-access") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Then run Supabase middleware
  const response = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
