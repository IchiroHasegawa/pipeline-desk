import { NextRequest, NextResponse } from "next/server";
import { generateStagingToken, getDeploymentMode } from "@/lib/deployment";

export async function POST(request: NextRequest) {
  try {
    const mode = getDeploymentMode();
    
    // Only allow this route in staging or local (for testing)
    if (mode === "production") {
      return NextResponse.json({ error: "Staging access is not available in production mode" }, { status: 403 });
    }

    const body = await request.json();
    const { accessCode } = body;

    const expectedCode = process.env.PRODUCTION_OS_TEST_ACCESS_CODE;
    
    if (!expectedCode) {
      console.error("PRODUCTION_OS_TEST_ACCESS_CODE is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!accessCode || accessCode !== expectedCode) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }

    // Generate secure token
    const token = await generateStagingToken(expectedCode);

    // Create response
    const response = NextResponse.json({ success: true });
    
    // Set cookie
    response.cookies.set("production_os_staging_access", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure when deployed
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Staging auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
