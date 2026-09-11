export type Route =
  | { name: "today" }
  | { name: "item"; id: string }
  | { name: "favorites" }
  | { name: "history" }
  | { name: "day"; date: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "item" && parts[1]) {
    return { name: "item", id: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === "favorites") {
    return { name: "favorites" };
  }
  if (parts[0] === "history") {
    return { name: "history" };
  }
  if (parts[0] === "day" && parts[1]) {
    return { name: "day", date: decodeURIComponent(parts[1]) };
  }
  return { name: "today" };
}

export function navigate(path: string): void {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}
