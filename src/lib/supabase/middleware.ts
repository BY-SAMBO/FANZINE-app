import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Debug: log all auth cookies present
  const authCookies = request.cookies
    .getAll()
    .filter((c) => c.name.includes("auth") || c.name.includes("sb-"));
  console.log(
    `[MW] ${request.method} ${pathname} | cookies: ${authCookies.map((c) => `${c.name}=${c.value.slice(0, 20)}...`).join(", ") || "NONE"}`
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log(
            `[MW] setAll called with ${cookiesToSet.length} cookies: ${cookiesToSet.map((c) => c.name).join(", ")}`
          );
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
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

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/api/auth/callback"];
  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.some((route) => pathname.startsWith(route));

  let user = null;
  let authError = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    authError = error;
    console.log(
      `[MW] getUser result: ${user ? `OK (id=${user.id}, email=${user.email})` : `NO USER`} | error: ${authError?.message || "none"}`
    );
  } catch (err) {
    console.error(`[MW] getUser EXCEPTION:`, err);
  }

  if (!user && !isPublicRoute) {
    console.log(`[MW] REDIRECT → /login (no user, path=${pathname})`);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    console.log(`[MW] REDIRECT → /dashboard (user on /login)`);
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  console.log(
    `[MW] PASS → ${pathname} (user=${user ? "YES" : "NO"}, public=${isPublicRoute})`
  );
  return supabaseResponse;
}
