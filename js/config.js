// ============================================================
//  CONFIGURACIÓN — es lo único que hay que editar antes de subir
// ============================================================

// 1) Pegue aquí la configuración de su proyecto de Firebase
//    (Consola de Firebase > Configuración del proyecto > Tus apps > Web).
//    Mientras apiKey esté vacío, la plataforma trabaja en MODO DE PRUEBA:
//    los registros solo se guardan en el navegador de ese dispositivo.
export const firebaseConfig = {
  apiKey: "AIzaSyDBKYYxPeFsHJlpJupZNwtpNwtctTgou4g",
  authDomain: "tvm-registro.firebaseapp.com",
  projectId: "tvm-registro",
  storageBucket: "tvm-registro.firebasestorage.app",
  messagingSenderId: "374092779232",
  appId: "1:374092779232:web:4730be775ba4e79b9b4a85"
};

// 2) El panel pide "usuario" y contraseña. Por dentro, el usuario se convierte
//    en un correo: usuario@DOMINIO_ADMIN (ej. gustavoortega@tvm-registro.app).
//    Ese correo y su contraseña se crean en Firebase > Authentication.
//    La contraseña NUNCA se escribe en estos archivos.
export const DOMINIO_ADMIN = "tvm-registro.app";

// 3) WhatsApp de TVM (con lada de país, sin signos) para el botón de contacto.
export const WHATSAPP_TVM = "5215512248006";

// 4) Catálogos del formulario
export const SERVICIOS = [
  "Líneas de vida (horizontales o verticales)",
  "Puntos de anclaje",
  "Certificación o recertificación anual",
  "Redes de seguridad",
  "Barandales",
  "Paso de gato",
  "Torres de inspección",
  "Mantenimiento de naves industriales",
  "Trabajos con acceso por cuerdas (rope access)",
  "Capacitación en alturas (constancia DC-3)",
  "Otro"
];

export const ORIGENES = [
  "Expo / evento",
  "Recomendación",
  "Búsqueda en Google",
  "Redes sociales",
  "LinkedIn",
  "Ya soy cliente de TVM",
  "Otro"
];

export const ESTADOS = [
  { id: "nuevo", nombre: "Nuevo" },
  { id: "contactado", nombre: "Contactado" },
  { id: "cotizado", nombre: "Cotizado" },
  { id: "cerrado", nombre: "Cerrado" },
  { id: "descartado", nombre: "Descartado" }
];
