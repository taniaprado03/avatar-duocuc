# DUOC UC — Tótem de Autoservicio con Avatar Virtual

Aplicación React para un tótem de autoservicio universitario con avatar virtual **Leonor**.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar API Key de Claude

Copia el archivo de ejemplo y agrega tu clave:

```bash
cp .env.example .env
```

Edita `.env` y reemplaza con tu API key de Anthropic:

```
VITE_CLAUDE_API_KEY=sk-ant-api03-XXXXXXXX
```

### 3. Agregar videos del avatar

Coloca los archivos `.mp4` en la carpeta `public/videos/`:

| Archivo | Descripción |
|---------|------------|
| `bienvenida.mp4` | Video de bienvenida |
| `login_instrucciones.mp4` | Instrucciones de login |
| `login_exitoso.mp4` | Login exitoso |
| `login_fallo.mp4` | Login fallido |
| `menu_principal.mp4` | Menú principal |
| `tramite_exitoso.mp4` | Trámite completado |
| `tramite_error.mp4` | Error en trámite |
| `derivar_asesor.mp4` | Derivación a asesor |
| `despedida.mp4` | Despedida |
| `inactividad.mp4` | Timeout por inactividad |
| `no_entendi.mp4` | Voz no reconocida |

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en Chrome (necesario para Web Speech API).

## 📋 Funcionalidades

- **Máquina de estados**: IDLE → WELCOME → LOGIN → MENU → CONFIRMING → EXECUTING → RESULT → GOODBYE
- **Login biométrico simulado**: Botones Éxito/Fallar (máx. 2 reintentos)
- **Reconocimiento de voz**: Web Speech API (español Chile) + Claude para mapear al menú
- **4 trámites**: Certificado, Horario, Progreso y Situación Financiera
- **Modo accesible**: Sin video, subtítulos grandes, botones de 80px+, solo botones
- **Timeout de sesión**: 120 segundos de inactividad → vuelve a IDLE
- **Límite de acciones**: Máximo 4 trámites exitosos por sesión

## 🛠 Stack

- React 18 + Vite
- Web Speech API (nativo del navegador)
- Anthropic Claude API
- CSS puro (sin Tailwind)
