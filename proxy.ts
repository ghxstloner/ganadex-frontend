import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/", "/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ganadex_token")?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isProtectedRoute && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && token && !pathname.startsWith("/dashboard")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname === "/" && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
