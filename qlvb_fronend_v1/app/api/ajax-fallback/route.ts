import { NextResponse } from "next/server";

// This is a fallback route to handle any ajax.php requests
// that might be coming from legacy code or third-party scripts
export async function POST() {
  // console.log("Intercepted ajax.php request");

  // Return an empty 200 response to prevent errors in the console
  return NextResponse.json({ success: true, message: "API endpoint migrated" });
}

export async function GET() {

  // Return an empty 200 response to prevent errors in the console
  return NextResponse.json({ success: true, message: "API endpoint migrated" });
}
