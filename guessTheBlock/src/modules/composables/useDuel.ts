import { onBeforeUnmount, ref } from "vue";
import type {
  DuelClientMessage,
  DuelMode,
  DuelServerMessage,
  DuelView,
} from "../interfaces/compete.interface";
import { WS_URL } from "../data/api";
import { cleanNickname, player } from "./usePlayer";

/** Errors after which reconnecting makes no sense. */
const FATAL = new Set([
  "not-found",
  "room-full",
  "replaced",
  "invalid-nickname",
  "invalid-player",
  "bad-mode",
  "server-full",
]);

export type DuelConnection = "connecting" | "open" | "reconnecting" | "closed";

/**
 * A live duel room over a WebSocket. Reconnects by itself (phones drop the
 * socket when you switch to WhatsApp to send the link) and gets the same
 * seat back, since seats belong to the player id.
 *
 * @param onCreated Called with the new code when a room is created
 */
export function useDuel(onCreated: (code: string) => void) {
  const room = ref<DuelView | null>(null);
  const connection = ref<DuelConnection>("closed");
  /** Fatal error code, e.g. "not-found" */
  const error = ref<string | null>(null);
  /** Last non-fatal error, e.g. "already-guessed" */
  const notice = ref<string | null>(null);
  /** Local clock minus server clock, for the countdown */
  const clockOffset = ref(0);

  let socket: WebSocket | null = null;
  let code: string | null = null;
  let createMode: DuelMode | null = null;
  let retries = 0;
  let retryTimer = 0;
  let stopped = false;

  function open() {
    window.clearTimeout(retryTimer);
    connection.value = room.value ? "reconnecting" : "connecting";
    const ws = new WebSocket(WS_URL);
    socket = ws;
    ws.onopen = () => {
      retries = 0;
      const hello: DuelClientMessage = {
        type: "hello",
        player: player.id,
        nickname: cleanNickname(),
        ...(code ? { join: code } : { create: createMode ?? "race" }),
      };
      ws.send(JSON.stringify(hello));
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as DuelServerMessage;
      if (message.type === "state") {
        connection.value = "open";
        error.value = null;
        clockOffset.value = Date.now() - message.room.serverNow;
        if (!code) {
          code = message.room.code;
          onCreated(code);
        }
        room.value = message.room;
      } else if (FATAL.has(message.code)) {
        error.value = message.code;
        stop();
      } else {
        notice.value = message.code;
      }
    };
    ws.onclose = () => {
      if (socket !== ws || stopped) return;
      socket = null;
      connection.value = "reconnecting";
      retryTimer = window.setTimeout(open, Math.min(1000 * 2 ** retries, 8000));
      retries++;
    };
  }

  /** Back in the foreground: don't wait for the backoff. */
  function onVisible() {
    if (document.visibilityState === "visible" && !stopped && !socket) open();
  }

  function start(target: { join: string } | { create: DuelMode }) {
    stop();
    stopped = false;
    error.value = null;
    room.value = null;
    code = "join" in target ? target.join : null;
    createMode = "create" in target ? target.create : null;
    document.addEventListener("visibilitychange", onVisible);
    open();
  }

  function stop() {
    stopped = true;
    window.clearTimeout(retryTimer);
    document.removeEventListener("visibilitychange", onVisible);
    const ws = socket;
    socket = null;
    ws?.close();
    connection.value = "closed";
  }

  function send(message: DuelClientMessage) {
    notice.value = null;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  onBeforeUnmount(stop);

  return {
    room,
    connection,
    error,
    notice,
    clockOffset,
    start,
    stop,
    pick: (block: string) => send({ type: "pick", block }),
    guess: (block: string) => send({ type: "guess", block }),
    giveUp: () => send({ type: "giveUp" }),
    rematch: () => send({ type: "rematch" }),
  };
}
