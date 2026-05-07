const SENT_KEY = "garageos.notif.sent";

export type Permission = NotificationPermission | "unsupported";

export function getNotificationPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<Permission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") return Notification.permission;
  const res = await Notification.requestPermission();
  return res;
}

function loadSent(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}
function saveSent(map: Record<string, number>) {
  localStorage.setItem(SENT_KEY, JSON.stringify(map));
}

/** Send a browser notification at most once per id per `ttlMs`. */
export function notifyOnce(id: string, title: string, options?: NotificationOptions, ttlMs = 1000 * 60 * 60 * 12) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const sent = loadSent();
  const now = Date.now();
  if (sent[id] && now - sent[id] < ttlMs) return;
  try {
    new Notification(title, options);
    sent[id] = now;
    saveSent(sent);
  } catch {
    /* ignore */
  }
}