const ENDPOINTS = ["http://127.0.0.1:27123", "https://127.0.0.1:27124"];
const KEY_STORAGE = "pretend-ai:obsidian-key";
export const OBSIDIAN_FOLDER = "raw";

let activeBase: string | null = null;

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

function encodeVaultPath(path: string): string {
  return String(path)
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function requestWithFallback(path: string, init: RequestInit, key: string): Promise<Response> {
  const candidates = activeBase
    ? [activeBase, ...ENDPOINTS.filter((base) => base !== activeBase)]
    : ENDPOINTS;

  let lastError: unknown = null;
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${key}`,
          ...(init.headers ?? {}),
        },
      });
      activeBase = base;
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("无法连接本地 Obsidian");
}

export async function testObsidianConnection(key = getObsidianKey()): Promise<void> {
  if (!key) {
    throw new Error("还没有填写 API Key");
  }
  const response = await requestWithFallback("/vault/", { method: "GET" }, key);
  if (!response.ok) {
    throw new Error(`连接返回 HTTP ${response.status}`);
  }
}

export async function saveToObsidian(fileName: string, markdown: string): Promise<string> {
  const key = getObsidianKey();
  if (!key) {
    throw new Error("还没有填写 API Key");
  }
  const path = obsidianPath(fileName);
  const response = await requestWithFallback(
    `/vault/${encodeVaultPath(path)}`,
    { method: "PUT", body: markdown, headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    key,
  );
  if (!response.ok) {
    throw new Error(`写入失败（HTTP ${response.status}）`);
  }
  return path;
}

export function describeObsidianError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("无法连接")) {
    return "连不上本地 Obsidian：请确认 Obsidian 已打开、Local REST API 插件已启用，并在插件设置里打开「Enable HTTP server」（端口 27123）";
  }
  if (message.includes("401") || message.includes("403")) {
    return "API Key 不正确，请在 Obsidian 的 Local REST API 设置里重新复制";
  }
  return message;
}