import { NextResponse } from "next/server";

/** After a form POST, use 303 so the browser follows with GET (307 would repeat POST → 405 on pages). */
export function redirectGet(url: string | URL) {
  return NextResponse.redirect(url, 303);
}
