import {
  createRealtimeClient,
  type RealtimeOptions,
} from "../providers/client";

/**
 * Hook nezávislý na frameworku: zavolejte jej z klientské komponenty
 * a při unmountu provolejte `cleanup`.
 *
 * Při vypnutém realtime modulu nebo chybějící URL vrací nečinnou dvojici,
 * takže volitelné kód nemusí nic vědět o konfiguraci.
 *
 * @param options Konfigurace z {@link RealtimeOptions} navíc s `enabled`,
 *   kterým lze spojení přepnout na `false`.
 * @returns Dvojice `{ send, cleanup }`; `send` vrací `true` jen při odeslání
 *   zprávy na otevřené spojení.
 * @throws Error při neplatném URL WebSocketu nebo při `ws:` na stránce s `https:`.
 */
export function useRealtime(options: RealtimeOptions & { enabled?: boolean }) {
  if (options.enabled === false || !options.url)
    return { send: (_: unknown) => false, cleanup() {} };
  const client = createRealtimeClient(options);
  client.connect();
  /** Uzavře spojení a zruší posluchače `pagehide`. */
  const cleanup = () => {
    client.close();
    window.removeEventListener("pagehide", cleanup);
  };
  window.addEventListener("pagehide", cleanup, { once: true });
  return { send: client.send, cleanup };
}
