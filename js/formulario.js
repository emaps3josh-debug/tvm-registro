import { SERVICIOS, ORIGENES, WHATSAPP_TVM } from "./config.js";
import { MODO_PRUEBA, crearRegistro, leerExpo, mensajeDeError } from "./store.js";
import { esDiaDeExpo, fechaLarga } from "./util.js";

const $ = (id) => document.getElementById(id);
const form = $("formulario");
if (MODO_PRUEBA) $("avisoPrueba").classList.remove("oculto");

// catálogos
SERVICIOS.forEach((s, i) => {
  const l = document.createElement("label");
  l.className = "opcion";
  const c = document.createElement("input");
  c.type = "checkbox"; c.name = "servicios"; c.value = s; c.id = "srv" + i;
  const t = document.createElement("span"); t.textContent = s;
  l.append(c, t); $("servicios").append(l);
});
$("origen").append(new Option("Seleccione una opción", ""));
ORIGENES.forEach((o) => $("origen").append(new Option(o, o)));

// fechas de la Expo (las define el administrador en el panel)
let expo = {};
leerExpo().then((cfg) => {
  expo = cfg || {};
  if (expo.dia1 && expo.dia2) {
    const nombre = expo.nombre ? `${expo.nombre}: ` : "";
    $("promoFechas").textContent = `${nombre}válido para solicitudes registradas el ${fechaLarga(expo.dia1)} y el ${fechaLarga(expo.dia2)}.`;
  }
  if (expo.nombre) $("origen").value = "Expo / evento";
}).catch(() => {});

// validación
const reglas = {
  empresa: (v) => v.trim().length >= 2,
  contacto: (v) => v.trim().length >= 3,
  telefono: (v) => v.replace(/\D/g, "").length >= 10,
  correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  ubicacion: (v) => v.trim().length >= 3,
  origen: (v) => v !== ""
};
const marcar = (el, bien) => { el.closest(".campo").classList.toggle("mal", !bien); el.setAttribute("aria-invalid", String(!bien)); return bien; };
Object.keys(reglas).forEach((k) => {
  $(k).addEventListener("blur", () => marcar($(k), reglas[k]($(k).value)));
  $(k).addEventListener("input", () => { if ($(k).closest(".campo").classList.contains("mal")) marcar($(k), reglas[k]($(k).value)); });
});
const elegidos = () => [...form.querySelectorAll("input[name=servicios]:checked")].map((c) => c.value);
$("servicios").addEventListener("change", () => $("campoServicios").classList.toggle("mal", elegidos().length === 0));
$("acepta").addEventListener("change", () => $("campoAcepta").classList.toggle("mal", !$("acepta").checked));

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("errorEnvio").style.display = "none";
  let primero = null;
  Object.keys(reglas).forEach((k) => { if (!marcar($(k), reglas[k]($(k).value)) && !primero) primero = $(k); });
  const hayServicio = elegidos().length > 0;
  $("campoServicios").classList.toggle("mal", !hayServicio);
  if (!hayServicio && !primero) primero = $("srv0");
  $("campoAcepta").classList.toggle("mal", !$("acepta").checked);
  if (!$("acepta").checked && !primero) primero = $("acepta");
  if (primero) { primero.focus(); primero.scrollIntoView({ block: "center", behavior: "smooth" }); return; }

  const datos = {
    empresa: $("empresa").value.trim(),
    contacto: $("contacto").value.trim(),
    correo: $("correo").value.trim().toLowerCase(),
    telefono: $("telefono").value.trim(),
    servicios: elegidos(),
    detalle: $("detalle").value.trim(),
    ubicacion: $("ubicacion").value.trim(),
    sitioWeb: $("sitioWeb").value.trim(),
    origen: $("origen").value,
    acepta: true
  };
  const boton = $("enviar");
  boton.disabled = true; $("enviarTxt").textContent = "Enviando…";
  try {
    const id = await crearRegistro(datos);
    $("graciasNombre").textContent = datos.contacto.split(" ")[0];
    $("folio").textContent = id.slice(-6).toUpperCase();
    $("graciasPromo").textContent = esDiaDeExpo(Date.now(), expo)
      ? "Su solicitud quedó registrada dentro de la Expo: su certificación anual será sin costo."
      : "";
    const texto = encodeURIComponent(`Hola, acabo de registrar a ${datos.empresa} en el formulario de TVM. Mi folio es ${id.slice(-6).toUpperCase()}.`);
    $("waTVM").href = `https://wa.me/${WHATSAPP_TVM}?text=${texto}`;
    form.classList.add("oculto");
    $("barraProgreso").style.width = "100%";
    $("gracias").classList.remove("oculto");
    $("gracias").scrollIntoView({ block: "start", behavior: "smooth" });
  } catch (e) {
    console.error(e);
    $("errorEnvio").textContent = "No se pudo enviar la solicitud. " + mensajeDeError(e);
    $("errorEnvio").style.display = "block";
  } finally {
    boton.disabled = false; $("enviarTxt").textContent = "Solicitar cotización";
  }
});

// ---------- avance y efectos ----------
function avance() {
  const ok = {
    empresa: reglas.empresa($("empresa").value), contacto: reglas.contacto($("contacto").value), telefono: reglas.telefono($("telefono").value),
    correo: reglas.correo($("correo").value), servicios: elegidos().length > 0, ubicacion: reglas.ubicacion($("ubicacion").value),
    origen: reglas.origen($("origen").value), acepta: $("acepta").checked
  };
  const hechos = Object.values(ok).filter(Boolean).length, total = Object.keys(ok).length;
  $("barraProgreso").style.width = Math.round((hechos / total) * 100) + "%";
  $("bloque1").classList.toggle("listo", ok.empresa);
  $("bloque2").classList.toggle("listo", ok.contacto && ok.telefono && ok.correo);
  $("bloque3").classList.toggle("listo", ok.servicios && ok.ubicacion && ok.origen);
  const t = $("avanceTexto");
  t.replaceChildren();
  if (hechos === total) t.textContent = "Todo listo para enviar.";
  else { const b = document.createElement("b"); b.textContent = `${hechos} de ${total}`; t.append(b, " datos necesarios completos"); }
}
form.addEventListener("input", avance);
form.addEventListener("change", avance);
avance();

document.documentElement.classList.add("anim");
const piezas = document.querySelectorAll(".aparece");
if ("IntersectionObserver" in window) {
  const ojo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); ojo.unobserve(e.target); } }), { threshold: 0.08 });
  piezas.forEach((p) => ojo.observe(p));
  setTimeout(() => piezas.forEach((p) => p.classList.add("visto")), 2500);   // respaldo
} else piezas.forEach((p) => p.classList.add("visto"));

$("otro").addEventListener("click", () => {
  form.reset(); avance(); $("barraProgreso").style.width = "0%";
  form.querySelectorAll(".mal").forEach((c) => c.classList.remove("mal"));
  if (expo.nombre) $("origen").value = "Expo / evento";
  $("gracias").classList.add("oculto");
  form.classList.remove("oculto");
  window.scrollTo({ top: 0, behavior: "smooth" });
  $("empresa").focus();
});
