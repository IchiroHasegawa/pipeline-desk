import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getDeploymentMode, verifyStagingAccess } from "@/lib/deployment";

export async function proxy(request: NextRequest) {
  // First run Supabase middleware
  const response = await updateSession(request);

  const mode = getDeploymentMode();
  
  // Staging deployment gate
  if (mode === "staging") {
    const { pathname } = request.nextUrl;
    
    // Allow static files, Next.js assets, and auth API routes
    const isPublicAsset = pathname.startsWith('/_next') || 
                          pathname.startsWith('/api/auth/staging') ||
                          pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/);
                          
    if (!isPublicAsset) {
      const isAuthorized = await verifyStagingAccess(request);
      
      if (pathname === "/test-access") {
        if (isAuthorized) {
          // If already authorized and trying to access /test-access, redirect to app
          return NextResponse.redirect(new URL("/production", request.url));
        }
      } else {
        if (!isAuthorized) {
          // Unauthorised access to app routes -> redirect to /test-access
          return NextResponse.redirect(new URL("/test-access", request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
