// Utilidades compartidas
const ZONA = "America/Mexico_City";

// "2026-11-18" a partir de un instante, en hora del centro de México
export function diaMX(ms) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

export function esDiaDeExpo(ms, expo) {
  if (!expo || !ms) return false;
  const d = diaMX(ms);
  return (!!expo.dia1 && d === expo.dia1) || (!!expo.dia2 && d === expo.dia2);
}

// "2026-11-18" -> "18 de noviembre"
export function fechaLarga(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, d)));
}

export function fechaHora(ms) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
}

export function soloDigitos(t) { return (t || "").replace(/\D/g, ""); }

// Número para wa.me: agrega 52 si vienen 10 dígitos
export function paraWhatsApp(t) {
  const d = soloDigitos(t);
  return d.length === 10 ? "52" + d : d;
}

export function urlSegura(t) {
  const v = (t || "").trim();
  if (!v) return "";
  const u = /^https?:\/\//i.test(v) ? v : "https://" + v;
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:" ? x.href : ""; } catch { return ""; }
}
