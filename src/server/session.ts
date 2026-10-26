import { parseLocaleCookie } from "../i18n/locale";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  getRequestHeaders,
  setResponseStatus,
} from "@tanstack/react-start/server";
import { authConfigured, googleConfigured, getAuth } from "../lib/auth";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const configured = authConfigured();
    const headers = getRequestHeaders();
    const session =
      configured && headers.get("cookie")?.includes("better-auth.session_token")
        ? await getAuth().api.getSession({ headers })
        : null;
    return {
      session: session
        ? {
            user: {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image ?? null,
            },
          }
        : null,
      locale: parseLocaleCookie(headers.get("cookie")),
      configured,
      googleEnabled: configured && googleConfigured(),
    };
  },
);
export const requireUser = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = authConfigured()
      ? await getAuth().api.getSession({ headers: getRequestHeaders() })
      : null;
    if (!session) {
      setResponseStatus(401);
      throw new Error("Vui lòng đăng nhập lại.");
    }
    return next({ context: { userId: session.user.id } });
  },
);
