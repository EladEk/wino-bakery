export const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v)||0));
export const stepAdd = (v, step) => Math.round((Number(v||0) + step) * 100) / 100;
export const isIntLike = (v) => Number.isFinite(Number(v)) && Math.floor(Number(v))===Number(v);
