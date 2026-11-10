import { ESTADOS } from "./config.js";
import { MODO_PRUEBA, entrar, salir, alCambiarSesion, escucharRegistros, actualizarRegistro, borrarRegistro,
         leerExpo, guardarExpo, mensajeDeError } from "./store.js";
import { esDiaDeExpo, fechaHora, fechaLarga, diaMX, soloDigitos, paraWhatsApp, urlSegura } from "./util.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const nombreEstado = (id) => (ESTADOS.find((e) => e.id === id) || { nombre: id }).nombre;

if (MODO_PRUEBA) $("avisoPrueba").classList.remove("oculto");

let registros = [];
let expo = {};
let dejarDeEscuchar = null;
const tarjetas = new Map();   // id -> { nodo, huella }

// ---------- sesión ----------
$("formAcceso").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const b = $("botonEntrar");
  $("msjAcceso").textContent = "";
  b.disabled = true; b.textContent = "Entrando…";
  try { await entrar($("usuario").value, $("clave").value); }
  catch (e) { $("msjAcceso").textContent = mensajeDeError(e); }
  finally { b.disabled = false; b.textContent = "Entrar"; $("clave").value = ""; }
});
$("salir").addEventListener("click", () => salir());

alCambiarSesion(async (sesion) => {
  $("vistaAcceso").classList.toggle("oculto", !!sesion);
  $("vistaPanel").classList.toggle("oculto", !sesion);
  if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
  if (!sesion) { registros = []; tarjetas.clear(); $("lista").replaceChildren(); $("usuario").focus(); return; }
  $("quien").textContent = sesion.usuario;
  try { expo = (await leerExpo()) || {}; } catch { expo = {}; }
  dejarDeEscuchar = await escucharRegistros((lista) => { registros = lista; pintar(); }, (e) => {
    $("vacio").textContent = mensajeDeError(e);
    $("vacio").classList.remove("oculto");
  });
});

// ---------- filtros ----------
$("filtroEstado").append(new Option("Todos los estados", ""));
ESTADOS.forEach((e) => $("filtroEstado").append(new Option(e.nombre, e.id)));
["buscar", "filtroEstado", "filtroPromo"].forEach((id) => $(id).addEventListener("input", pintar));

function visibles() {
  const q = $("buscar").value.trim().toLowerCase();
  const est = $("filtroEstado").value, pr = $("filtroPromo").value;
  return registros.filter((r) => {
    if (est && r.estado !== est) return false;
    const promo = esDiaDeExpo(r.creado, expo);
    if (pr === "si" && !promo) return false;
    if (pr === "no" && promo) return false;
    if (!q) return true;
    return [r.empresa, r.contacto, r.correo, r.telefono, r.ubicacion, (r.servicios || []).join(" "), r.detalle]
      .join(" ").toLowerCase().includes(q);
  });
}

// ---------- pintado ----------
function pintar() {
  const hoy = diaMX(Date.now());
  $("nTotal").textContent = registros.length;
  $("nNuevos").textContent = registros.filter((r) => r.estado === "nuevo").length;
  $("nPromo").textContent = registros.filter((r) => esDiaDeExpo(r.creado, expo)).length;
  $("nHoy").textContent = registros.filter((r) => diaMX(r.creado) === hoy).length;

  const aviso = $("avisoExpo");
  if (expo.dia1 && expo.dia2) {
    aviso.textContent = `${expo.nombre || "Expo"}: el beneficio aplica a solicitudes del ${fechaLarga(expo.dia1)} y del ${fechaLarga(expo.dia2)}.`;
  } else {
    aviso.textContent = "Aún no ha indicado los dos días de la Expo. Toque «Fechas de Expo» para que el panel marque qué solicitudes tienen la certificación anual sin costo.";
  }
  aviso.classList.remove("oculto");

  const lista = visibles();
  const cont = $("lista");
  const usados = new Set();
  let previo = null;
  lista.forEach((r) => {
    const huella = JSON.stringify(r) + esDiaDeExpo(r.creado, expo);
    let t = tarjetas.get(r.id);
    const ocupado = t && t.nodo.contains(document.activeElement) && document.activeElement.tagName === "TEXTAREA";
    if (!t || (t.huella !== huella && !ocupado)) {
      const abierto = t ? t.nodo.open : false;
      const nodo = tarjeta(r);
      nodo.open = abierto;
      if (t) t.nodo.replaceWith(nodo);
      t = { nodo, huella };
      tarjetas.set(r.id, t);
    }
    usados.add(r.id);
    const esperado = previo ? previo.nextSibling : cont.firstChild;
    if (t.nodo !== esperado) cont.insertBefore(t.nodo, esperado);
    previo = t.nodo;
  });
  [...tarjetas.keys()].forEach((id) => { if (!usados.has(id)) { tarjetas.get(id).nodo.remove(); tarjetas.delete(id); } });
  $("vacio").textContent = registros.length ? "Ningún registro coincide con la búsqueda." : "Aún no hay registros. Cuando un cliente llene el formulario aparecerá aquí al instante.";
  $("vacio").classList.toggle("oculto", lista.length > 0);
}

function dato(titulo, valor, completo) {
  const d = el("div", completo ? "completo" : "");
  d.append(el("span", "", titulo));
  const p = el("p");
  if (valor instanceof Node) p.append(valor); else p.textContent = valor || "—";
  d.append(p);
  return d;
}

function tarjeta(r) {
  const promo = esDiaDeExpo(r.creado, expo);
  const det = el("details", "registro e-" + r.estado);
  const sum = el("summary");
  const izq = el("div");
  izq.append(el("div", "empresa", r.empresa), el("div", "sub", `${r.contacto} · ${r.ubicacion}`));
  const der = el("div", "lado");
  if (promo) der.append(el("span", "chapa promo", "Beneficio Expo"));
  der.append(el("span", "chapa " + r.estado, nombreEstado(r.estado)), el("div", "", fechaHora(r.creado)));
  sum.append(izq, der);
  det.append(sum);

  const cuerpo = el("div", "detalle");
  const datos = el("div", "datos");
  const tel = el("a", "", r.telefono); tel.href = "tel:" + soloDigitos(r.telefono);
  const mail = el("a", "", r.correo); mail.href = "mailto:" + r.correo;
  const web = urlSegura(r.sitioWeb);
  let nodoWeb = r.sitioWeb || "—";
  if (web) { nodoWeb = el("a", "", r.sitioWeb); nodoWeb.href = web; nodoWeb.target = "_blank"; nodoWeb.rel = "noopener noreferrer"; }
  datos.append(
    dato("Persona de contacto", r.contacto), dato("Teléfono", tel), dato("Correo", mail), dato("Sitio web", nodoWeb),
    dato("Ubicación del servicio", r.ubicacion), dato("Cómo se enteró", r.origen),
    dato("Servicios de interés", (r.servicios || []).join("\n"), true),
    dato("Detalle del proyecto", r.detalle, true),
    dato("Beneficio Expo", promo ? "Sí: certificación anual sin costo" : "No aplica (fuera de los días de la Expo)"),
    dato("Folio", r.id.slice(-6).toUpperCase())
  );
  cuerpo.append(datos);

  // notas
  const campo = el("div", "campo");
  const lab = el("label", "", "Notas internas"); lab.htmlFor = "nota-" + r.id;
  const ta = el("textarea"); ta.id = "nota-" + r.id; ta.value = r.notas || ""; ta.maxLength = 3000;
  ta.placeholder = "Seguimiento, acuerdos, próxima llamada…";
  campo.append(lab, ta);
  cuerpo.append(campo);

  const fila = el("div", "fila-acciones");
  const sel = el("select"); sel.setAttribute("aria-label", "Estado del registro");
  ESTADOS.forEach((e) => sel.append(new Option(e.nombre, e.id, false, e.id === r.estado)));
  sel.addEventListener("change", () => actualizarRegistro(r.id, { estado: sel.value }).catch((e) => alertar(e)));
  const guardar = el("button", "boton chico", "Guardar notas"); guardar.type = "button";
  const ok = el("span", "guardado");
  guardar.addEventListener("click", async () => {
    try { await actualizarRegistro(r.id, { notas: ta.value.trim() }); ok.textContent = "Guardado"; setTimeout(() => (ok.textContent = ""), 2500); }
    catch (e) { alertar(e); }
  });
  const wa = el("a", "boton claro chico", "WhatsApp"); wa.target = "_blank"; wa.rel = "noopener";
  wa.href = `https://wa.me/${paraWhatsApp(r.telefono)}?text=${encodeURIComponent(`Hola ${r.contacto.split(" ")[0]}, le saluda TVM Expertos en Alturas. Recibimos su solicitud de cotización para ${r.empresa}.`)}`;
  const llamar = el("a", "boton claro chico", "Llamar"); llamar.href = "tel:" + soloDigitos(r.telefono);
  const correo = el("a", "boton claro chico", "Correo");
  correo.href = `mailto:${r.correo}?subject=${encodeURIComponent("Su solicitud de cotización con TVM")}`;
  const borrar = el("button", "boton peligro chico", "Eliminar"); borrar.type = "button";
  borrar.addEventListener("click", () => pedirBorrado(r));
  fila.append(sel, guardar, ok, wa, llamar, correo, borrar);
  cuerpo.append(fila);
  det.append(cuerpo);
  return det;
}

function alertar(e) {
  $("vacio").textContent = mensajeDeError(e);
  $("vacio").classList.remove("oculto");
}

// ---------- eliminar ----------
let porBorrar = null;
function pedirBorrado(r) {
  porBorrar = r.id;
  $("txtBorrar").textContent = `Se eliminará de forma permanente el registro de «${r.empresa}». Esta acción no se puede deshacer.`;
  $("dlgBorrar").showModal();
}
$("noBorrar").addEventListener("click", () => $("dlgBorrar").close());
$("siBorrar").addEventListener("click", async () => {
  const id = porBorrar; porBorrar = null; $("dlgBorrar").close();
  if (id) { try { await borrarRegistro(id); } catch (e) { alertar(e); } }
});

// ---------- fechas de Expo ----------
$("abrirExpo").addEventListener("click", () => {
  $("expoNombre").value = expo.nombre || ""; $("expoDia1").value = expo.dia1 || ""; $("expoDia2").value = expo.dia2 || "";
  $("dlgExpo").showModal();
});
$("cerrarExpo").addEventListener("click", () => $("dlgExpo").close());
$("formExpo").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const cfg = { nombre: $("expoNombre").value.trim(), dia1: $("expoDia1").value, dia2: $("expoDia2").value };
  try { await guardarExpo(cfg); expo = cfg; $("dlgExpo").close(); pintar(); } catch (e) { $("dlgExpo").close(); alertar(e); }
});

// ---------- exportar ----------
$("exportar").addEventListener("click", () => {
  const celda = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;      // evita que Excel lo interprete como fórmula
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const cab = ["Folio", "Fecha", "Empresa", "Contacto", "Correo", "Teléfono", "Servicios", "Detalle", "Ubicación", "Sitio web",
               "Cómo se enteró", "Beneficio Expo", "Estado", "Notas"];
  const filas = visibles().map((r) => [
    r.id.slice(-6).toUpperCase(), fechaHora(r.creado), r.empresa, r.contacto, r.correo, r.telefono, (r.servicios || []).join("; "),
    r.detalle, r.ubicacion, r.sitioWeb, r.origen, esDiaDeExpo(r.creado, expo) ? "Sí" : "No", nombreEstado(r.estado), r.notas
  ]);
  const csv = "﻿" + [cab, ...filas].map((f) => f.map(celda).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `registros-tvm-${diaMX(Date.now())}.csv`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
