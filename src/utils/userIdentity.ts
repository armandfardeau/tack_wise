import { USER_ID_COOKIE_NAME } from '../../entities/user';

const userIdCookieMaxAge = 60 * 60 * 24 * 365;

function readUserIdCookie(): string | undefined {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${USER_ID_COOKIE_NAME}=`));

  return cookie?.slice(USER_ID_COOKIE_NAME.length + 1) || undefined;
}

export function getOrCreateUserId(): string {
  const existingUserId = readUserIdCookie();
  if (existingUserId) return existingUserId;

  const userId = crypto.randomUUID();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${USER_ID_COOKIE_NAME}=${userId}; Path=/; Max-Age=${userIdCookieMaxAge}; SameSite=Lax${secure}`;
  return userId;
}
