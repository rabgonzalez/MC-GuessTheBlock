import { MessageKey } from "../i18n/en";
import { t } from "../i18n";

const KNOWN = [
  "offline",
  "not-found",
  "room-full",
  "replaced",
  "server-full",
  "too-many-requests",
];

/** Message for a server error code ("not-found", "offline"...). */
export const errorText = (code: string | null | undefined) =>
  t(
    (code && KNOWN.includes(code)
      ? `error.${code}`
      : "error.generic") as MessageKey
  );
