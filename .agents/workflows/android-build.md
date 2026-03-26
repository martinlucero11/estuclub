---
description: Guía paso a paso para generar la APK de Android con Capacitor
---

Para generar tu aplicación de Android y que funcione 100% sincronizada con tu web de Firebase, seguí estos pasos:

### 1. Preparar el Proyecto
Asegururate de que los últimos cambios estén listos y que Capacitor reconozca tu plataforma:

```bash
npx cap sync android
```

### 2. Abrir en Android Studio
Este comando va a abrir tu proyecto de Android automáticamente en el IDE:

```bash
npx cap open android
```

### 3. Generar la APK (En Android Studio)
Una vez que Android Studio termine de indexar el proyecto (vas a ver una barra de carga abajo a la derecha):

1. En el menú superior, andá a **Build**.
2. Seleccioná **Build Bundle(s) / APK(s)**.
3. Hacé click en **Build APK(s)**.

### 4. Instalar en tu Celular
Cuando termine, Android Studio te va a mostrar un cartelito abajo a la derecha que dice "APK(s) generated successfully".
- Hacé click en **locate** para abrir la carpeta donde está la APK.
- Copiá el archivo `app-debug.apk` a tu celular e instalalo.

> [!TIP]
> Si querés que la App se actualice sola cada vez que hacés un push a GitHub sin tener que volver a generar la APK, asegurate de que el `capacitor.config.ts` apunte a tu URL de Firebase.
