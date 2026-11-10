// Capa de datos: Firebase (producción) o localStorage (modo de prueba).
import { firebaseConfig, DOMINIO_ADMIN } from "./config.js";

export const MODO_PRUEBA = !firebaseConfig.apiKey;
const V = "10.12.2";
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;

let fb = null;
async function firebase() {
  if (fb) return fb;
  const [app, fs, au] = await Promise.all([
    import(CDN + "firebase-app.js"),
    import(CDN + "firebase-firestore.js"),
    import(CDN + "firebase-auth.js")
  ]);
  const a = app.initializeApp(firebaseConfig);
  fb = { fs, au, db: fs.getFirestore(a), auth: au.getAuth(a) };
  return fb;
}

const correoDe = (usuario) =>
  usuario.includes("@") ? usuario.trim().toLowerCase() : `${usuario.trim().toLowerCase()}@${DOMINIO_ADMIN}`;

// ---------- modo de prueba ----------
const memoria = {};
const LS = {
  leer: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? (memoria[k] ?? d) : JSON.parse(v) ?? d; } catch { return memoria[k] ?? d; } },
  guardar: (k, v) => { memoria[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f(LS.leer("tvm_registros", []).sort((a, b) => b.creado - a.creado)));
let sesionLocal = null;
const oyentesAuth = new Set();

// ---------- API ----------
export async function crearRegistro(datos) {
  if (MODO_PRUEBA) {
    const lista = LS.leer("tvm_registros", []);
    const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    lista.push({ ...datos, id, estado: "nuevo", notas: "", creado: Date.now() });
    LS.guardar("tvm_registros", lista);
    avisar();
    return id;
  }
  const { fs, db } = await firebase();
  const ref = await fs.addDoc(fs.collection(db, "registros"), {
    ...datos, estado: "nuevo", notas: "", creado: fs.serverTimestamp()
  });
  return ref.id;
}

export async function leerExpo() {
  if (MODO_PRUEBA) return LS.leer("tvm_expo", {});
  const { fs, db } = await firebase();
  const s = await fs.getDoc(fs.doc(db, "config", "expo"));
  return s.exists() ? s.data() : {};
}

export async function guardarExpo(cfg) {
  if (MODO_PRUEBA) return LS.guardar("tvm_expo", cfg);
  const { fs, db } = await firebase();
  await fs.setDoc(fs.doc(db, "config", "expo"), cfg);
}

export async function entrar(usuario, clave) {
  if (MODO_PRUEBA) {
    if (!usuario.trim() || !clave) throw new Error("Escriba usuario y contraseña.");
    sesionLocal = { usuario: usuario.trim() };
    oyentesAuth.forEach((f) => f(sesionLocal));
    return;
  }
  const { au, auth } = await firebase();
  await au.signInWithEmailAndPassword(auth, correoDe(usuario), clave);
}

export async function salir() {
  if (MODO_PRUEBA) { sesionLocal = null; oyentesAuth.forEach((f) => f(null)); return; }
  const { au, auth } = await firebase();
  await au.signOut(auth);
}

export async function alCambiarSesion(fn) {
  if (MODO_PRUEBA) { oyentesAuth.add(fn); fn(sesionLocal); return; }
  const { au, auth } = await firebase();
  au.onAuthStateChanged(auth, (u) => fn(u ? { usuario: (u.email || "").split("@")[0] } : null));
}

// Devuelve una función para dejar de escuchar.
export async function escucharRegistros(fn, alFallar) {
  if (MODO_PRUEBA) { oyentes.add(fn); avisar(); return () => oyentes.delete(fn); }
  const { fs, db } = await firebase();
  const q = fs.query(fs.collection(db, "registros"), fs.orderBy("creado", "desc"));
  return fs.onSnapshot(q, (snap) => {
    fn(snap.docs.map((d) => {
      const x = d.data();
      return { ...x, id: d.id, creado: x.creado?.toMillis ? x.creado.toMillis() : Date.now() };
    }));
  }, alFallar);
}

export async function actualizarRegistro(id, cambios) {
  if (MODO_PRUEBA) {
    const lista = LS.leer("tvm_registros", []).map((r) => (r.id === id ? { ...r, ...cambios } : r));
    LS.guardar("tvm_registros", lista); avisar(); return;
  }
  const { fs, db } = await firebase();
  await fs.updateDoc(fs.doc(db, "registros", id), cambios);
}

export async function borrarRegistro(id) {
  if (MODO_PRUEBA) {
    LS.guardar("tvm_registros", LS.leer("tvm_registros", []).filter((r) => r.id !== id)); avisar(); return;
  }
  const { fs, db } = await firebase();
  await fs.deleteDoc(fs.doc(db, "registros", id));
}

export function mensajeDeError(e) {
  const c = e?.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found") || c.includes("invalid-email"))
    return "Usuario o contraseña incorrectos.";
  if (c.includes("too-many-requests")) return "Demasiados intentos. Espere unos minutos e intente de nuevo.";
  if (c.includes("network")) return "Sin conexión a internet. Revise su red e intente de nuevo.";
  if (c.includes("permission-denied")) return "Este usuario no tiene permiso para ver los registros.";
  return e?.message || "Ocurrió un error. Intente de nuevo.";
}
