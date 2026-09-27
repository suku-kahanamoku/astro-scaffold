import type { APIRoute } from "astro";
import { site } from "../../../config/site";
import { HttpError, errorResponse } from "../../../server/http/errors";
import { readFields } from "../../../server/http/request";
import { writeToken } from "../../../modules/auth/server/session";
import { isLocale, url } from "../../../i18n";

export const POST: APIRoute = async (context) => {
  const form = context.request.headers
    .get("content-type")
    ?.startsWith("application/x-www-form-urlencoded");
  let locale: "cs" | "en" | "de" = "cs";
  try {
    if (!site.modules.auth) throw new HttpError(404, "not_found");
    const data = await readFields(context.request);
    if (typeof data.locale === "string" && isLocale(data.locale))
      locale = data.locale;
    if (
      typeof data.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ||
      data.email.length > 254 ||
      typeof data.password !== "string" ||
      !data.password ||
      data.password.length > 1024
    )
      throw new HttpError(422, "invalid_input");
    const result = await context.locals.providers.auth.login(
      data.email.trim(),
      data.password,
    );
    writeToken(
      context.cookies,
      result.token,
      context.site?.protocol === "https:" || import.meta.env.PROD,
    );
    return form
      ? context.redirect(url(locale, "account"), 303)
      : Response.json({ success: true, data: result.user });
  } catch (error) {
    if (form) {
      const code =
        error instanceof HttpError && [401, 422].includes(error.status)
          ? "invalid"
          : "unavailable";
      return context.redirect(`${url(locale, "login")}?error=${code}`, 303);
    }
    return errorResponse(error);
  }
};
