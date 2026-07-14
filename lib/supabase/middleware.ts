import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser();

  const protectedRoutes = [
    "/production",
    "/assets/manage",
    "/assets/assembly",
    "/open-tasks",
    "/review",
    "/reports",
    "/settings"
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (isProtectedRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const { data } = await supabase
      .from('profiles')
      .select('account_status, system_role')
      .eq('id', user.id)
      .single();
      
    const profile = data as unknown as { account_status: string; system_role: string } | null;

    if (profile?.account_status !== 'active') {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "account_unavailable");
      
      const redirectResponse = NextResponse.redirect(url);
      request.cookies.getAll().forEach((cookie) => {
         if (cookie.name.startsWith('sb-')) {
             redirectResponse.cookies.delete(cookie.name);
         }
      });
      return redirectResponse;
    }
    
    // AAL2 Enforcement for Owner Access
    if (profile?.system_role === 'owner') {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session exists, the user check above would have caught it, but just in case
      if (session) {
        const { data: { factors } } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactors = factors && factors.filter(f => f.status === 'verified').length > 0;
        const currentLevel = supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const isAal1 = currentLevel.data?.currentLevel === 'aal1';
        
        // Settings Owner Auth route needs protection, unless they have 0 factors (for initial enrollment)
        const isOwnerAuthRoute = request.nextUrl.pathname.startsWith("/settings/security/owner");
        
        if (isAal1 && hasVerifiedFactors) {
          // If they have enrolled factors and are only AAL1, redirect to MFA challenge
          const url = request.nextUrl.clone();
          url.pathname = "/owner-login";
          url.searchParams.set("step", "3");
          return NextResponse.redirect(url);
        } else if (isOwnerAuthRoute && isAal1 && !hasVerifiedFactors) {
          // Allow access to enrollment UI (owner settings) for initial setup
          // No action needed
        } else if (isOwnerAuthRoute && profile.system_role !== 'owner') {
          // Non-owners shouldn't access owner settings
          const url = request.nextUrl.clone();
          url.pathname = "/settings/security";
          return NextResponse.redirect(url);
        }
      }
    }
  }
  
  if ((request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) && user) {
    // Also verify profile is active before redirecting to production
    const { data } = await supabase
      .from('profiles')
      .select('account_status, system_role')
      .eq('id', user.id)
      .single();
      
    const profile = data as unknown as { account_status: string; system_role: string } | null;
      
    if (profile?.account_status === 'active') {
      const url = request.nextUrl.clone();
      url.pathname = "/production";
      return NextResponse.redirect(url);
    }
  }

  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/production" : "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
