/** Local dev only: bypass gate when `NODE_ENV=development` and set to `1`. Never in production. */
export function isAuthSkipped(): boolean {
  return process.env.NODE_ENV === "development" && process.env.SKIP_ADMIN_AUTH === "1";
}
