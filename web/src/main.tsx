import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

const BUILD_ID = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";

const container = document.getElementById("root");

if (!container) {
  throw new Error("缺少 #root 挂载节点");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

async function checkForUpdate(reload: boolean) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const data: { buildId?: string } = await response.json();
    if (!data?.buildId || data.buildId === BUILD_ID || !reload) {
      return;
    }
    // 带上新的版本参数重新进入，绕过 CDN 对 HTML 的缓存
    const url = new URL(window.location.href);
    url.searchParams.set("v", data.buildId);
    window.location.replace(url.toString());
  } catch {
    // 离线或 version.json 缺失时忽略
  }
}

void checkForUpdate(false);
window.setInterval(() => void checkForUpdate(true), 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    void checkForUpdate(true);
  }
});