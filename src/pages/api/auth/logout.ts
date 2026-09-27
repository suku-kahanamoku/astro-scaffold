import type { APIRoute } from "astro";
import { site } from "../../../config/site";
import { HttpError, errorResponse } from "../../../server/http/errors";
import { clearToken, readToken } from "../../../modules/auth/server/session";
import { readFields } from "../../../server/http/request";
import { isLocale, url, type Locale } from "../../../i18n";

export const POST: APIRoute = async (context) => {
  let locale: Locale = "cs";
  const form = context.request.headers
    .get("content-type")
    ?.startsWith("application/x-www-form-urlencoded");
  try {
    if (!site.modules.auth) throw new HttpError(404, "not_found");
    const data = await readFields(context.request);
    if (typeof data.locale === "string" && isLocale(data.locale))
      locale = data.locale;
    const token = readToken(context.cookies);
    if (token) {
      try {
        await context.locals.providers.auth.logout(token);
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 401)) throw error;
      }
    }
    clearToken(context.cookies);
    return form
      ? context.redirect(url(locale, "login"), 303)
      : Response.json({ success: true, data: null });
  } catch (error) {
    return form
      ? context.redirect(`${url(locale, "account")}?error=logout`, 303)
      : errorResponse(error);
  }
};
