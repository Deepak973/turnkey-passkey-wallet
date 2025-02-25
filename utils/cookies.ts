import Cookies from "js-cookie";

export const COOKIE_KEYS = {
  USER_EMAIL: "user_email",
  SESSION: "session",
} as const;

export const setCookie = (key: string, value: string) => {
  Cookies.set(key, value, { expires: 7 }); // 7 days expiry
};

export const getCookie = (key: string) => {
  return Cookies.get(key);
};

export const removeCookie = (key: string) => {
  Cookies.remove(key);
};
