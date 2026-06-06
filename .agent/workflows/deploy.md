---
description: Cómo subir cambios a Git y desplegar en Vercel
---

# Subir cambios a Vercel

// turbo-all

1. Verificar que estás en la rama `main`:
```powershell
git checkout main
```

2. Agregar todos los archivos modificados:
```powershell
git add .
```

3. Crear el commit con un mensaje descriptivo (reemplazar el mensaje según corresponda):
```powershell
git commit -m "MENSAJE DESCRIPTIVO AQUÍ"
```

4. Subir a GitHub (Vercel reconstruirá automáticamente):
```powershell
git push origin main
```

> **IMPORTANTE**: Siempre trabajar directamente en la rama `main`. 
> No usar otras ramas como `clean_commit` o `fresh_main` ya que Vercel solo despliega desde `main`.
