# TVM · Registro de clientes y panel admin

Plataforma web estática (HTML, CSS y JavaScript, sin compilación) para subir a Vercel.
Los datos se guardan en Firebase (Firestore) y el acceso al panel usa Firebase Authentication.

- `index.html`  → formulario para clientes
- `admin.html`  → panel de registros (en Vercel queda como `/admin`)
- `js/config.js` → lo único que hay que editar
- `firestore.rules` → reglas de seguridad para pegar en Firebase

## Puesta en marcha (una sola vez)

### 1. Crear el proyecto en Firebase
1. Entre a https://console.firebase.google.com y cree un proyecto (por ejemplo `tvm-registro`).
2. **Firestore Database** → Crear base de datos → modo de producción.
3. **Authentication** → Comenzar → método **Correo electrónico/contraseña** → Habilitar.
4. En Authentication → **Users** → Agregar usuario:
   - Correo: `gustavoortega@tvm-registro.app`
   - Contraseña: la que usará Gustavo en el panel
   En el panel, Gustavo escribe solo el usuario `GustavoOrtega` y su contraseña.
5. **Firestore Database → Reglas**: borre lo que haya, pegue el contenido de `firestore.rules` y publique.

### 2. Conectar la plataforma
1. En Firebase: Configuración del proyecto → Tus apps → icono Web (`</>`) → registre la app.
2. Copie los valores de `firebaseConfig` y péguelos en `js/config.js`.

### 3. Subir a Vercel
Suba la carpeta completa (o el repositorio de GitHub). No requiere comando de compilación.

### 4. Indicar los días de la Expo
Entre a `/admin` → **Fechas de Expo** → escriba el nombre del evento y los dos días.
Las solicitudes recibidas en esos días quedan marcadas con «Beneficio Expo»
(certificación anual sin costo) y el formulario muestra las fechas al cliente.

## Modo de prueba
Mientras `apiKey` esté vacío en `js/config.js`, todo funciona en modo de prueba:
los registros se guardan solo en el navegador y el panel deja entrar con cualquier usuario.
Sirve para revisar el diseño; **no lo use en la Expo**.
Para abrirlo en su computadora necesita un servidor local (por ejemplo `npx serve`),
porque los módulos de JavaScript no cargan al abrir el archivo con doble clic.

## Seguridad
- La contraseña no está escrita en ningún archivo: vive en Firebase Authentication.
- Los visitantes solo pueden enviar su registro; no pueden leer los de otros.
- Solo el correo listado en `firestore.rules` puede ver, editar o borrar registros.
- Para dar acceso a otra persona: créela en Authentication y agregue su correo
  a la lista de `esAdmin()` en las reglas.
