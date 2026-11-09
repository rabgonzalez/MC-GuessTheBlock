import type {
  ChallengeView,
  LookupResponse,
} from "../interfaces/compete.interface";
import { player } from "../composables/usePlayer";
import { PUBLIC_URL } from "./site";

/**
 * Competitive server (../../../../server). Set at build time:
 * .env.development points to localhost, .env.production to the real one.
 */
export const API_URL = (
  process.env.VUE_APP_API_URL || "https://guess-the-block.jonaykb.com"
).replace(/\/+$/, "");

/** ws:// or wss:// twin of the API URL. */
export const WS_URL = `${API_URL.replace(/^http/, "ws")}/ws`;

/** Error from the server ("not-found", "finished"...) or "offline". */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 0) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, body?: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "X-Player-Id": player.id,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("offline");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "server-error", res.status);
  return data as T;
}

export const api = {
  lookup: (code: string) =>
    request<LookupResponse>(`/lookup/${encodeURIComponent(code)}`),
  createChallenge: (nickname: string) =>
    request<ChallengeView>("/challenges", { nickname }),
  challenge: (code: string) => request<ChallengeView>(`/challenges/${code}`),
  joinChallenge: (code: string, nickname: string) =>
    request<ChallengeView>(`/challenges/${code}/join`, { nickname }),
  guessChallenge: (code: string, block: string) =>
    request<ChallengeView>(`/challenges/${code}/guess`, { block }),
  giveUpChallenge: (code: string) =>
    request<ChallengeView>(`/challenges/${code}/give-up`, {}),
};

/** Shareable link to a competitive game. */
export function competeLink(kind: "challenge" | "duel", code: string) {
  const { protocol, origin, pathname } = window.location;
  // Inside Electron there is no web address to share: use the public site.
  const base = protocol.startsWith("http") ? origin + pathname : PUBLIC_URL;
  return `${base}#/${kind}/${code}`;
}
