const API_BASE = "https://127.0.0.1:27124";
const KEY_STORAGE = "pretend-ai:obsidian-key";
export const OBSIDIAN_FOLDER = "raw";

export function getObsidianKey(): string {
  try {
    return window.localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setObsidianKey(key: string): void {
  try {
    window.localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    // 忽略存储失败
  }
}

export function clearObsidianKey(): void {
  try {
    window.localStorage.removeItem(KEY_STORAGE);
  } catch {
    // 忽略
  }
}

export function obsidianPath(fileName: string): string {
  return `${OBSIDIAN_FOLDER}/${fileName}`;
}

function authHeaders(key: string): HeadersInit {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "text/markdown; charset=utf-8",
  };
}

export async function testObsidianConnection(key = getObsidianKey()): Promise<void> {
  if (!key) {
    throw new Error("还没有填写 API Key");
  }
  const response = await fetch(`${API_BASE}/vault/`, { headers: authHeaders(key) });
  if (!response.ok) {
    throw new Error(`连接返回 ${response.status}`);
  }
}

export async function saveToObsidian(fileName: string, markdown: string): Promise<string> {
  const key = getObsidianKey();
  if (!key) {
    throw new Error("还没有填写 API Key");
  }
  const path = obsidianPath(fileName);
  const response = await fetch(`${API_BASE}/vault/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: authHeaders(key),
    body: markdown,
  });
  if (!response.ok) {
    throw new Error(`写入失败（HTTP ${response.status}）`);
  }
  return path;
}

export function describeObsidianError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "连不上本地 Obsidian：请确认 Obsidian 已打开、插件已启用，并已访问 https://127.0.0.1:27124/ 信任本地证书";
  }
  return message;
}