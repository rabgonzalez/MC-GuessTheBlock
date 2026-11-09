import { reactive, watch } from "vue";

const ID_KEY = "guess-the-block:player";
const NICKNAME_KEY = "guess-the-block:nickname";
export const NICKNAME_MAX = 16;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not kept: a new anonymous id next time.
  }
}

function newId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Who you are in the competitive modes: an anonymous random id, made up by
 * this browser (it works as your password, never shown to other players),
 * and the nickname they see.
 */
export const player = reactive({
  id: read(ID_KEY) ?? newId(),
  nickname: read(NICKNAME_KEY) ?? "",
});

write(ID_KEY, player.id);
watch(
  () => player.nickname,
  (value) => write(NICKNAME_KEY, value)
);

/** Nickname as the server will store it, or "" if empty. */
export const cleanNickname = (value = player.nickname) =>
  [...value.replace(/\s+/g, " ").trim()].slice(0, NICKNAME_MAX).join("");
