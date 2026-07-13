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
      .select('account_status')
      .eq('id', user.id)
      .single();
      
    const profile = data as unknown as { account_status: string } | null;

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
  }
  
  if ((request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) && user) {
    // Also verify profile is active before redirecting to production
    const { data } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .single();
      
    const profile = data as unknown as { account_status: string } | null;
      
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
