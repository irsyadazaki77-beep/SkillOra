export function safeParse<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

export function safeStringify(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  return JSON.stringify(val);
}
