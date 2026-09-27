# Astro scaffold

Univerzální základ běžného obsahového webu s vlastní serverovou vrstvou před php-core. Inspirace: `astro-prasentace` (společné šablony, JSON překlady, centrální značka) a `astro-sorry-jako` (malé komponenty a jednoduchý routing). Žádná závislost na souborech sousedních projektů.

Obsahuje Astro 7, Node SSR, nativní file routing/API/middleware, češtinu/angličtinu/němčinu, Tailwind 4, daisyUI 5, `astro:assets`, `astro-seo`, sitemap, robots, přihlášení přes php-core, modulové providery, lifecycle hooks, WebSocket klienta a čtyřstranný reklamní rám. Veřejné stránky mají společný layout a fungují bez backendu; přihlašovací formulář funguje i bez JavaScriptu.

## Spuštění

Node >= 22.12.0, npm. Verze závislostí jsou uzamčené v `package-lock.json`.

```sh
npm ci
cp .env.example .env
npm run dev
```

Výchozí adresa: `http://localhost:4321`. Pro první náhled nejsou potřeba tajné údaje. Přihlášení bez nastaveného backendu zobrazí lokalizovanou chybu.

```sh
npm test
npm run build
npm run start
```

`start` načte lokální `.env`, pokud existuje. V hostingu nastavujte serverové proměnné přímo v prostředí. `PUBLIC_SITE_URL` se používá při sestavení (canonical, sitemap, očekávaný origin formulářů); po změně web znovu sestavte. Build nevolá php-core. `HOST` a `PORT` nastavují naslouchání standalone serveru.

## Nový projekt

1. Zkopírujte tento adresář bez `node_modules`, `dist`, `.astro`, `.env`, testových výstupů a případného `.git`. Ponechte lockfile a `.env.example`.
2. Změňte název balíčku v `package.json` (poté `npm install --package-lock-only`), značku/kontakt/moduly v `src/config/site.ts` a barvy v `src/styles/global.css`.
3. Nastavte `PUBLIC_SITE_URL`, `PHP_CORE_URL`, `PHP_CORE_API_KEY` a `PHP_CORE_TENANT_HOST`. Skutečné hodnoty klíčů necommitujte.
4. Zajistěte backendové mapování hostu, například `novy-web.cz:tenant_code` v `FRANCHISE_CODES` php-core. Frontend toto mapování nevytváří. Backend URL může obsahovat `/api` prefix.
5. Nahraďte ukázkový obsah, `src/assets/hero.svg`, `public/social.png` a favicon. Pro rastrové obrázky používejte `Image`/`Picture` z `astro:assets`; lokální SVG ukázka se záměrně nerasterizuje a nepotřebuje vzdálený image host.
6. Nastavte případné reklamní jednotky, CMP a veřejnou WebSocket URL. Bez této konfigurace žádné externí reklamní ani WebSocket spojení nevzniká.

## Struktura a rozšiřování

```text
src/
  config/                 značka, moduly, trasy, reklama
  locales/ + i18n/         JSON slovníky a společné URL/route helpery
  pages/                  tenké Astro routy a explicitní /api endpointy
  layouts/                společné HTML, SEO a reklamní rám
  components/layout/      hlavička, patička, rám
  modules/
    pages/                veřejné pohledy
    auth/                 typy, komponenty, server/client provider, cookie
    ads/                  slot a Google/Seznam adaptéry
    realtime/             WebSocket lifecycle
  server/                 server-only kompozice providerů a HTTP klient
  providers/              browser API klient a napojení na CMP
  hooks/                  server request/response a klientský realtime hook
  styles/                 Tailwind, daisyUI téma, breakpointy a layout
```

Novou stránku přidejte do `src/config/routes.ts`, její texty do všech slovníků a pohled do `modules`. `[...path].astro` je tenký společný dispatcher. Veřejné stránky přidejte i do `publicPages`: z této jediné konfigurace vzniká sitemap. CZ je bez prefixu, EN/DE s prefixem; `url(locale, page)` používají odkazy i hreflang. Neznámé cesty vracejí skutečnou 404.

Novou doménovou funkci přidejte jako `modules/<name>/{types.ts,server/provider.ts,components/...}`. Provider dostane `CoreClient` z `server/providers.ts`, vlastní pevné endpointy a mapování odpovědí. Pro browser přidejte konkrétní `pages/api/...` handler s validací vstupu a klientský provider přes `providers/api.ts`. Nesestavujte PHP cestu z libovolného browserového vstupu a nevytvářejte catch-all proxy.

`hooks/server.ts` spravuje request ID, ochranu mutací a hlavičky odpovědí. `middleware.ts` skládá závislosti pro každý request a poskytuje lazy `locals.getUser()`, které v jednom požadavku ověří uživatele nejvýše jednou. Veřejné stránky uživatele nenačítají. Při nové chráněné stránce nastavte `locals.privatePage = true`, ověřte `getUser()` a až poté načítejte soukromá data.

## php-core a autentizace

Každý upstream požadavek přidává serverový `X-Internal-Key` a pevný `X-Forwarded-Host` z prostředí. Hodnoty z příchozího browserového požadavku se nepřebírají. Client má desetisekundový timeout, zakazuje redirecty a překládá upstream chyby do obecných kódů bez výpisu výjimek/tajemství. API root a klíč se importují přes `astro:env/server`.

| Astro endpoint           | php-core endpoint   | Chování                                                               |
| ------------------------ | ------------------- | --------------------------------------------------------------------- |
| POST `/api/auth/login/`  | POST `/auth/login`  | JSON nebo URL-encoded formulář, uloží token, vrací jen veřejný profil |
| GET `/api/auth/me/`      | GET `/auth/me`      | Ověřený profil, bez tokenu a dalších backendových polí                |
| POST `/api/auth/logout/` | POST `/auth/logout` | Odvolá token v backendu a smaže cookie                                |
| GET `/api/health/`       | žádný               | Liveness Astro serveru; není to kontrola php-core/DB                  |

User Bearer se přenáší v host-only `HttpOnly`, `SameSite=Lax` cookie, v produkci se `Secure`, bez localStorage. Cookie je relační; platnost a odvolání tokenu určuje php-core, backendový čas bez timezone se nepřepočítává. Není potřeba session databáze na jednotlivých Astro instancích. Pro souběžné instance stačí stejná konfigurace a backend. Při 401 z `/auth/me` se cookie zahodí; výpadek backendu se ukáže jako 503, nikoli jako falešné odhlášení. Při neúspěšném odvolání tokenu logout zobrazí chybu a zachová cookie pro opakování.

Všechny `/api` mutace kontrolují `Origin` proti nakonfigurovanému veřejnému originu (včetně portu). JSON i formuláře mají limit 16 KiB. API a soukromé stránky vracejí `Cache-Control: private, no-store`; validace a rate limiting přihlášení v php-core zůstávají zachované. Role v profilu slouží UI, nikdy nenahrazují backendovou autorizaci. Pro produkci nastavte HTTPS a případné edge rate limiting podle hostingu. Za reverse proxy musí `PUBLIC_SITE_URL` odpovídat veřejné adrese.

## Layout a reklama

Tailwind breakpointy: sm 640, md 768, lg 1024, xl 1280, 2xl 1536 px. Mobil má jednořádkovou hlavičku s rozbalovacím menu a skládaný obsah. Od md je hero dvousloupcové. Horní a dolní reklamní pozice jsou dostupné všude. Boční pozice se zobrazují až od xl (160 px, od 2xl 200 px); šířka hlavního obsahu zůstává čitelná. Sloty rezervují rozměry; reklama nepřekrývá obsah.

Jednotky se konfigurují samostatně v `src/config/ads.ts`:

```ts
top: { provider: "google", client: "ca-pub-SKUTECNE_CISLO", slot: "SKUTECNE_CISLO" },
left: { provider: "seznam", zoneId: 12345, width: 160, height: 600 },
```

Výchozí `placeholder` nikam nevolá. Produkční ID a rozměry získáte od provozovatele reklam. Google se inicializuje přes `adsbygoogle`, Seznam přes `sssp.getAds`; načítají se jen viditelné sloty poblíž viewportu a skript dodavatele nejvýše jednou. Skryté boční sloty na mobilu nevyvolávají reklamní požadavky. Po blokaci reklamy zůstane rezervovaný prostor; není zde automatické obnovování impresí.

Projektová CMP musí po vyhodnocení skutečného souhlasu zavolat v klientském modulu:

```ts
import { consentProvider } from "@/providers/consent";
consentProvider.setAdvertising(true); // pouze podle výsledku CMP
// při odvolání souhlasu:
consentProvider.setAdvertising(false);
```

Bridge není vlastní CMP a nevytváří souhlas za uživatele. Výchozí hodnota je false, nic se samo neukládá. Při odvolání po načtení reklamy se dokument obnoví, aby v něm neběžel starý reklamní skript; CMP musí změnu souhlasu uložit před zavoláním bridge. Konkrétní vendor consent, produkční reklamní účet a případný `ads.txt` doplňte podle projektu.

## WebSocket

`modules/realtime/client.ts` nabízí `connect`, `send`, `close`, stav připojení, JSON příjem, omezení send bufferu a exponenciální reconnect s jitterem a limitem pokusů. Policy/auth uzavření se automaticky neopakují. HTTPS stránka přijímá pouze WSS URL. `hooks/realtime.ts` připojení zapne jen při nastavené `PUBLIC_WEBSOCKET_URL` a aktivním modulu; vrácený `cleanup()` zavolejte při unmountu komponenty (pagehide ho zavolá také).

```ts
import { useRealtime } from "@/hooks/realtime";
const realtime = useRealtime({
  onMessage(data) {
    /* validate the domain payload */
  },
});
// Odesílejte po stavu "open"; send() vrací false, dokud socket není připraven.
realtime.send({ type: "subscribe", channel: "public-news" });
// On component unmount:
realtime.cleanup();
```

Scaffold neobsahuje fiktivní php-core WebSocket endpoint. Pro konkrétní projekt nastavte existující gateway a její zprávový kontrakt; privátní kanály potřebují skutečný ticket/auth endpoint a autorizaci na gateway. PHP API klíč ani uživatelský Bearer nevkládejte do veřejné URL nebo websocket protokolu. Serverový HTTP runtime sám o sobě nezaručuje podporu dlouhých WSS spojení v hostingu.

## Testování a nasazení

```sh
npm test
npm run build
npm exec playwright install chromium
npm run test:browser
npm run format:check
```

Jednotkové testy ověřují serverové hlavičky, pevný tenant, sanitizaci odpovědí, chyby/timeout, CSRF, limity těla a routy. Browser testy spouští vlastní php-core mock na 4399 a Astro na 4328; ověřují login/logout, HttpOnly cookie, 404, jazyky, SEO, menu a šířky 360–1920 px. Nepoužívají sdílenou DB ani skutečné účty. Mock kontraktu není důkaz živého přihlášení do produkčního php-core nebo živého výdeje reklamy.

Výchozí deployment je samostatný Node proces `dist/server/entry.mjs` za HTTPS reverse proxy. Build vytváří `dist/client` a `dist/server`; nasaďte obě části a runtime závislosti. Netlify/Vercel/Cloudflare vyžadují záměnu oficiálního Astro adaptéru a ověření serverových proměnných a runtime daného hostingu. Formuláře/auth se nesmí převést na čistý statický hosting.

Odkazy ke konvencím: [Astro Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/), [Astro i18n](https://docs.astro.build/en/guides/internationalization/), [daisyUI pro Astro](https://daisyui.com/docs/install/astro/), [astro-seo](https://github.com/jonasmerlin/astro-seo), [Seznam SSP](https://partner.seznam.cz/napoveda/seznam-partner-program/postup-nasazeni-reklamy/), [Google responsive ads](https://support.google.com/adsense/answer/9183460?hl=en).
