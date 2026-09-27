import { defineMiddleware, sequence } from "astro:middleware";
import { requestHook } from "./hooks/server";
import { createProviders } from "./server/providers";
import { clearToken, readToken } from "./modules/auth/server/session";
import { HttpError } from "./server/http/errors";
import type { User } from "./modules/auth/types";

export const onRequest = sequence(
  requestHook,
  defineMiddleware(async (context, next) => {
    context.locals.providers = createProviders();
    let userPromise: Promise<User | null> | undefined;
    context.locals.getUser = () =>
      (userPromise ??= (async () => {
        const token = readToken(context.cookies);
        if (!token) return null;
        try {
          return await context.locals.providers.auth.me(token);
        } catch (error) {
          if (error instanceof HttpError && error.status === 401) {
            clearToken(context.cookies);
            return null;
          }
          throw error;
        }
      })());
    return next();
  }),
);
