# TanIA — Tótem de Autoservicio con Avatar Virtual
**DUOC UC · Sede San Bernardo**

Aplicación React que potencia el tótem de autoservicio universitario con el avatar virtual **Leonor**, integrando reconocimiento facial, Claude AI y generación de tickets.

---

## 🏗 Arquitectura — 3 Ambientes

```
DEV (tu PC)          QA (servidor pruebas)    PRD (producción)
─────────────        ─────────────────────    ────────────────
docker compose up    docker compose           Vercel (frontend)
                     -f docker-compose.yml    Docker (backend)
                     -f docker-compose.qa.yml
                     up -d

Frontend :3000       Frontend :80             avatar-duocuc.vercel.app
Backend  :8080       Backend  :8080           cittsb.cl/asesor_totem
.env.dev             .env.qa                  .env.prd (NO en Git)
```

---

## 🐳 Inicio Rápido con Docker (recomendado)

> **Requiere:** Docker Desktop instalado · Chrome · Git

### DEV — Levantar todo localmente

```bash
# 1. Clonar el repo
git clone https://github.com/tu-org/avatar-duocuc.git
cd avatar-duocuc

# 2. Levantar con UN SOLO COMANDO
docker compose up --build
```

| Servicio | URL |
|---|---|
| 🖥️ Frontend (kiosk) | http://localhost:3000 |
| ⚙️ Backend (tickets) | http://localhost:8080 |

### QA — Levantar en servidor de pruebas

```bash
docker compose -f docker-compose.yml -f docker-compose.qa.yml up -d
```

### Apagar todo

```bash
docker compose down
```

---

## 🔑 Variables de Entorno

| Archivo | Ambiente | ¿Va a Git? |
|---|---|---|
| `.env.dev` | Desarrollo local | ✅ Sí (keys de dev) |
| `.env.qa` | QA / Staging | ✅ Sí (keys descartables) |
| `.env.prd` | Producción | ❌ NO — contiene keys reales |
| `.env.local` | Override personal | ❌ NO |

### Variables principales

```env
VITE_CLAUDE_API_KEY=sk-ant-api03-...     # API Key de Anthropic Claude
VITE_FIREBASE_API_KEY=...                 # Firebase (autenticación)
VITE_EMAILJS_PUBLIC_KEY=...              # EmailJS (envío de tickets)
VITE_BACKEND_URL=http://localhost:8080   # URL del backend PHP
VITE_SEDE=San Bernardo                   # Sede del tótem
```

---

## 🌿 Flujo de Trabajo con Git

```
feature/mi-feature
      │
      │  Desarrollo local
      │  docker compose up
      │
      ▼
  develop ──────────────────→ Deploy automático a QA
      │                        (GitHub Actions)
      │  QA prueba y aprueba ✅
      ▼
    main ───────────────────→ Deploy automático a Vercel (PRD)
                               (GitHub Actions)
```

### Comandos Git del día a día

```bash
# Crear una rama nueva
git checkout -b feature/nombre-de-tu-cambio

# Guardar cambios
git add .
git commit -m "feat: descripción del cambio"

# Subir al repo (va a QA automáticamente)
git push origin feature/nombre-de-tu-cambio

# Crear Pull Request en GitHub → develop
# Cuando QA aprueba → merge a main → Vercel hace deploy automático
```

---

## 🛠 Desarrollo sin Docker (alternativo)

```bash
# Instalar dependencias
npm install

# Ejecutar en modo dev
npm run dev
```

Abre `http://localhost:5173` en **Chrome** (requerido para Web Speech API y cámara).

---

## 📁 Estructura Docker

```
avatar-duocuc/
├── Dockerfile                    ← Frontend: Node → Nginx
├── docker-compose.yml            ← DEV: Frontend + Backend
├── docker-compose.qa.yml         ← Override para QA
├── docker/
│   ├── nginx/nginx.conf          ← Config Nginx (proxy a APIs)
│   └── backend/Dockerfile        ← PHP 8.3 + Apache + SQLite
├── .env.dev                      ← Variables DEV (en Git)
├── .env.qa                       ← Variables QA (en Git)
└── .env.prd                      ← Variables PRD (⚠️ NO en Git)
```

---

## 🎯 Funcionalidades

| Módulo | Descripción |
|---|---|
| **Avatar Leonor** | Videos sincronizados por estado del sistema |
| **Login biométrico** | Face-api.js — reconocimiento facial en tiempo real |
| **Reconocimiento de voz** | Web Speech API en español Chile + Claude AI |
| **4 trámites** | Certificados · Horario · Progreso académico · Situación financiera |
| **Sistema de tickets** | Backend PHP + SQLite + envío por email |
| **Modo accesible** | Sin video · Subtítulos grandes · Botones 80px+ |
| **Timeout de sesión** | 120 segundos de inactividad → regresa a IDLE |

**Máquina de estados:** `IDLE → WELCOME → LOGIN → MENU → CONFIRMING → EXECUTING → RESULT → GOODBYE`

---

## 📦 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | CSS puro |
| AI | Anthropic Claude API |
| Reconocimiento facial | face-api.js |
| Voz | Web Speech API |
| Backend | PHP 8.3 + Apache |
| Base de datos | SQLite (dev/qa) |
| Auth | Firebase |
| Email | EmailJS |
| Deploy frontend PRD | Vercel |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 👥 Equipos

| Equipo | Responsabilidad |
|---|---|
| **Producción** | Deploy, ambientes, monitoreo |
| **Desarrollo** | Features, bugfixes, pull requests |
| **QA** | Pruebas funcionales, accesibilidad, aprobación |
| **Datos** | Analytics, Firebase, reportes |
| **Avatar** | Videos Leonor, integración MuseTalk |

---

> 📄 Para documentación completa ver `Documentacion_Fase1_TanIA.docx`
