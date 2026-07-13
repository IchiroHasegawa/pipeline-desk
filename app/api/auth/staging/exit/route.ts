import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the staging access cookie
  response.cookies.delete("production_os_staging_access");
  
  return response;
}
