import { defineMiddleware, sequence } from "astro:middleware";
import { requestHook } from "./modules/CoreModule/server/requestHook";
import { sessionHook } from "./modules/AuthModule/server/sessionHook";
import { createProviders } from "./server/providers";
export const onRequest = sequence(
  requestHook,
  defineMiddleware(async (context, next) => {
    context.locals.providers = createProviders();
    return next();
  }),
  sessionHook,
);
