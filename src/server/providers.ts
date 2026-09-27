import {
  PHP_CORE_URL,
  PHP_CORE_API_KEY,
  PHP_CORE_TENANT_HOST,
} from "astro:env/server";
import { createCoreClient } from "./http/php-core";
import { createAuthProvider } from "../modules/auth/server/provider";

export function createProviders() {
  const core = createCoreClient({
    baseUrl: PHP_CORE_URL ?? "",
    apiKey: PHP_CORE_API_KEY ?? "",
    tenantHost: PHP_CORE_TENANT_HOST ?? "",
  });
  return { auth: createAuthProvider(core) };
}
export type Providers = ReturnType<typeof createProviders>;
