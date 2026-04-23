export const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};

export const numReq = (v: unknown): number => num(v) ?? 0;

export const numKeys = <T extends Record<string, unknown>>(
  row: T,
  keys: (keyof T)[],
): T => {
  const out = { ...row };
  for (const k of keys) {
    const v = out[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n)) (out as Record<string, unknown>)[k as string] = n;
    }
  }
  return out;
};
