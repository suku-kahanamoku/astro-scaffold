import { site } from "../config/site";
import {
  createRealtimeClient,
  type RealtimeOptions,
} from "../modules/realtime/client";

// Framework-independent hook: call from a client component and invoke cleanup on unmount.
export function useRealtime(options: Omit<RealtimeOptions, "url">) {
  const url = import.meta.env.PUBLIC_WEBSOCKET_URL;
  if (!site.modules.realtime || !url)
    return { send: (_: unknown) => false, cleanup() {} };
  const client = createRealtimeClient({ ...options, url });
  client.connect();
  const cleanup = () => {
    client.close();
    window.removeEventListener("pagehide", cleanup);
  };
  window.addEventListener("pagehide", cleanup, { once: true });
  return { send: client.send, cleanup };
}
