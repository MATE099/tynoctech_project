import { cookies } from "next/headers";

const SESSION_COOKIE = "tynoc_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Returns the current guest session id, creating one if it doesn't exist yet.
 *
 * We store a random id in an httpOnly cookie so each visitor has their own
 * cart/wishlist even before we build real authentication. This must be called
 * from a Route Handler or Server Action, because only those can WRITE cookies
 * (Server Components can read cookies but not set them).
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true, // not readable by browser JS -> safer
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return id;
}
