import http from "node:http";
import https from "node:https";

const DEFAULT_UA = "pretend-ai-pipeline/0.1 (+https://github.com/)";

export function request(url, options = {}) {
  const { method = "GET", headers = {}, body, timeoutMs = 20000, maxRedirects = 5 } = options;

  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }

    const lib = parsed.protocol === "http:" ? http : https;
    const req = lib.request(
      parsed,
      { method, headers: { "user-agent": DEFAULT_UA, ...headers } },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;

        if (status >= 300 && status < 400 && location && maxRedirects > 0) {
          res.resume();
          const next = new URL(location, url).toString();
          resolve(request(next, { ...options, maxRedirects: maxRedirects - 1 }));
          return;
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("请求超时：" + url));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function fetchText(url, options = {}) {
  const response = await request(url, options);
  if (response.status < 200 || response.status >= 300) {
    throw new Error("HTTP " + response.status + "：" + url);
  }
  return response.body;
}

export async function postJson(url, payload, options = {}) {
  const { headers = {}, timeoutMs = 90000 } = options;
  const body = JSON.stringify(payload);
  const response = await request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      ...headers,
    },
    body,
    timeoutMs,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error("HTTP " + response.status + "：" + response.body.slice(0, 300));
  }

  return JSON.parse(response.body);
}