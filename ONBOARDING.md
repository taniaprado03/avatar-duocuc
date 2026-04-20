# 🚀 Guía de Onboarding — Ambiente DEV TanIA
> Para todos los equipos: Desarrollo, QA, Avatar, Datos, Producción

---

## ¿Qué vas a tener al final?

```
Tu PC
 ├── Frontend (kiosk TanIA) → http://localhost:5173
 └── Backend (tickets PHP)  → http://localhost:8080
      └── Base de datos SQLite (ya configurada)
```

**Tiempo estimado: 10-15 minutos**

---

## PASO 1 — Instalar Docker Desktop

▶ Descarga desde: https://www.docker.com/products/docker-desktop/

- Windows: instalar el `.exe`, reiniciar si pide
- Mac: instalar el `.dmg`
- Linux: seguir las instrucciones de la página

✅ Verificar que funcionó: abre una terminal y escribe:
```powershell
docker --version
```
Debe mostrar algo como: `Docker version 27.x.x`

---

## PASO 2 — Instalar Git (si no lo tienes)

▶ Descarga desde: https://git-scm.com/downloads

✅ Verificar:
```powershell
git --version
```

---

## PASO 3 — Clonar el repositorio

```powershell
git clone https://github.com/taniaprado03/avatar-duocuc.git
cd avatar-duocuc
```

---

## PASO 4 — Configurar tus variables de entorno

Copia el archivo de variables para desarrollo:

```powershell
# En Windows (PowerShell):
Copy-Item .env.dev .env.local

# En Mac/Linux:
cp .env.dev .env.local
```

> ⚠️ Si necesitas una API key real de Claude para tu trabajo,
> pídela a Tania (lider de producción). El archivo `.env.dev`
> trae claves de desarrollo que son suficientes para la mayoría de pruebas.

---

## PASO 5 — Levantar el ambiente completo

```powershell
docker compose up --build
```

**La primera vez tarda ~5 minutos** (descarga las imágenes base de internet).
Las siguientes veces tarda menos de 30 segundos.

Cuando veas esto en la terminal, ya está listo:

```
Container tania-backend  Started
Container tania-frontend Started
```

---

## PASO 6 — Verificar que funciona

Abre **Google Chrome** (obligatorio, no Edge ni Firefox) y ve a:

| URL | Qué es |
|---|---|
| http://localhost:5173 | 🖥️ El tótem TanIA (para desarrollar/probar) |
| http://localhost:8080 | ⚙️ El backend PHP (sistema de tickets) |
| http://localhost:8080/asesor.php | 👨‍💼 Panel del asesor (ver cola de turnos) |

---

## Los 3 comandos que necesitas saber

```powershell
# LEVANTAR el sistema
docker compose up --build

# APAGAR el sistema (sin borrar datos)
docker compose down

# VER si están corriendo los contenedores
docker compose ps
```

---

## ¿Qué hace cada equipo con este ambiente?

### 💻 Equipo Desarrollo
- Edita los archivos en `src/` con tu editor (VS Code)
- Los cambios se ven **en tiempo real** en http://localhost:5173
- Trabajas en tu propia rama: `git checkout -b feature/mi-cambio`
- Cuando terminas: `git push` → Pull Request a la rama `develop`

### 🧪 Equipo QA
- Usas http://localhost:5173 para probar el flujo completo
- Haces el mismo recorrido que haría un alumno en el tótem
- Reportas bugs en GitHub → Issues → New Issue
- No necesitas tocar código

### 📊 Equipo Datos
- La base de datos está en el contenedor backend
- Para ver los datos:
  ```powershell
  docker exec tania-backend sqlite3 /var/www/html/data/database.sqlite "SELECT * FROM tickets;"
  ```
- Puedes conectar herramientas de análisis al puerto 8080
- Tu trabajo principal está en `src/services/analyticsService.js` (lo crearemos juntos)

### 🤖 Equipo Avatar
- No necesitas este ambiente para tu trabajo de MuseTalk
- Cuando tengas los videos `.mp4` listos, los pones en `public/videos/`
- Ejemplo: `public/videos/bienvenida.mp4`
- Luego se ven automáticamente en http://localhost:5173

### 🖥 Equipo Producción
- Este es el ambiente de referencia — si funciona aquí, funciona en todos lados
- Úsalo para validar cambios antes de subirlos al servidor QA

---

## Flujo de Trabajo con Git — Las 2 Ramas

```
main ────────────────────────────────────────────────► PRD (Vercel)
  ▲                                                      automático
  │ merge (aprobado por QA)
  │
develop ─── feature/mi-cambio ──► develop ────────────► QA (build check)
              Pull Request                               automático
```

### Para el Equipo de Desarrollo:

```powershell
# 1. Siempre parte desde develop
git checkout develop
git pull origin develop

# 2. Crea tu rama para trabajar
git checkout -b feature/nombre-de-tu-cambio

# 3. Trabaja, guarda cambios
git add .
git commit -m "feat: descripción de lo que hiciste"

# 4. Sube tu rama
git push origin feature/nombre-de-tu-cambio

# 5. En GitHub: abre Pull Request → base: develop
```

### Para el Equipo de QA:

Cuando el equipo de Desarrollo hace un Pull Request a `develop`:
- GitHub Actions hace el build automáticamente
- QA recibe el artefacto para probar
- Si aprueba → se hace merge a `develop`
- Cuando todos los cambios de un sprint están en `develop` → se hace merge a `main` → PRD

---

## Solución de problemas comunes

### ❌ "docker: command not found"
Docker Desktop no está instalado o no está corriendo. Abre la app Docker Desktop primero.

### ❌ El tótem carga pero no funciona la cámara
La cámara solo funciona con Chrome. Además, Chrome debe tener permisos de cámara. Busca el ícono de cámara en la barra de dirección y acepta el permiso.

### ❌ El reconocimiento de voz no funciona
Web Speech API solo funciona en Chrome y solo en localhost o HTTPS. Verifica que estés usando Chrome.

### ❌ "Port 5173 already in use"
Tienes otro proceso usando ese puerto. Cierra VS Code u otras apps de desarrollo y vuelve a intentar.

### ❌ Los contenedores no suben (error en docker compose up)
```powershell
# Reset completo (borra contenedores y vuelve a crear)
docker compose down -v
docker compose up --build
```

---

## Tu configuración lista en 1 imagen

```
Mi PC después del onboarding:
┌────────────────────────────────────────────┐
│                                            │
│  Docker Desktop ✅ (corriendo)             │
│                                            │
│  tania-frontend ✅                         │
│  → http://localhost:5173                   │
│    El tótem TanIA completo                 │
│                                            │
│  tania-backend ✅                          │
│  → http://localhost:8080                   │
│    Backend PHP + SQLite                    │
│    Tickets con reset diario                │
│                                            │
└────────────────────────────────────────────┘
```

---

## ¿Problemas? Contacta a:

| Problema | Contactar a |
|---|---|
| Docker no instala | Equipo Producción (Tania) |
| Error en el código | Equipo Desarrollo |
| Bug en el flujo del tótem | Equipo QA |
| Acceso al repo GitHub | Equipo Producción (Tania) |

---

*Guía TanIA · DUOC UC Sede San Bernardo · Actualizada 20 Abril 2026*
