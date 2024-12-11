# 🎬 TubeVault
> Tu Colección Privada de YouTube

*Leer en [English](README.md) | [Español](README.es.md)*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

TubeVault es una página estática que actúa como un servidor multimedia, permitiéndote acceder y organizar tus videos de YouTube en una interfaz similar a servicios como Plex o Jellyfin. Con TubeVault, puedes crear tu propia colección de películas, series y videos personales, accediendo a ellos de manera fácil y rápida.

## ✨ Características

🎯 **Organización Inteligente**
- Películas, Series y Videos Personales
- Búsqueda por título, director o actores
- Metadata rica (director, actores, sinopsis)

🎨 **Interfaz Moderna**
- Diseño responsive
- Pósters de TMDB
- Interfaz estilo streaming

💾 **Optimización**
- Caché local
- Carga lazy de imágenes
- Actualización automática

## 🛠️ Instalación y Configuración

### 1. Requisitos Previos

**Python**
- Se requiere Python 3.x
- Descárgalo de [python.org](https://www.python.org/downloads/) si no está instalado
- Verifica la instalación con `python3 --version`

### 2. Configuración de APIs

#### YouTube Data API v3
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Habilita YouTube Data API v3
4. En el panel de "Credenciales":
   - Crea una API Key
   - Configura OAuth 2.0:
     - Crea un ID de Cliente OAuth 2.0
     - En "Orígenes autorizados de JavaScript" agrega:
       ```
       http://localhost:8000
       http://127.0.0.1:8000
       ```
     - En "URI de redireccionamiento autorizados" agrega:
       ```
       http://localhost:8000
       http://127.0.0.1:8000
       ```

#### TMDB API
1. Crea una cuenta en [TMDB](https://www.themoviedb.org/signup)
2. Ve a la configuración de API
3. Solicita una API Key

### 3. Configuración del Proyecto

1. Clona el repositorio
2. Renombra `scripts/config.example.js` a `scripts/config.js`
3. En `scripts/config.js`, reemplaza los valores con tus claves:
```javascript
const CONFIG = {
    youtubeApiKey: 'TU_YOUTUBE_API_KEY',     // API Key de YouTube de Google Cloud Console
    oauthClientId: 'TU_OAUTH_CLIENT_ID',     // ID de Cliente OAuth 2.0 de Google Cloud Console
    channelId: 'TU_CHANNEL_ID',             // ID de tu canal de YouTube
    tmdbApiKey: 'TU_TMDB_API_KEY',         // API Key de TMDB
    updateInterval: 3600000,               // Intervalo de actualización en ms
    unlistedVideos: []                    // No es necesario modificar
};
```

### 4. Ejecutar el Servidor

1. Abre una terminal en el directorio del proyecto
2. Ejecuta el comando:
   ```bash
   python3 -m http.server 8000
   ```
3. Abre tu navegador y ve a `http://localhost:8000`

## 📝 Uso y Formato de Videos

### Formato de Descripción
Para que TubeVault pueda procesar correctamente tus videos, usa este formato en la descripción:

#### Para Películas
```
[DIRECTOR: Nombre del Director]
[ACTORES: Actor 1, Actor 2, Actor 3]
[SYNOPSIS: Descripción de la película]
```

#### Para Series
```
[TEMPORADA: 1]
[UNIDAD: 3]
[EPISODIO: 5]
[SYNOPSIS: Descripción del episodio]
```

#### Para Cursos
```
[UNIDAD: 2]
[EPISODIO: 1]
[SYNOPSIS: Descripción de la lección]
```

### Notas sobre el Formato
- Los tags deben estar en MAYÚSCULAS y entre corchetes
- La sinopsis puede contener múltiples líneas
- Para series y cursos:
  - TEMPORADA es opcional
  - UNIDAD agrupa episodios en secciones
  - EPISODIO determina el orden de reproducción

## ⚠️ Consideraciones

- La API de YouTube tiene un límite de 10,000 unidades diarias
- Usar con contenido propio o autorizado
- Los videos privados se actualizan automáticamente

## 🤖 Desarrollo con IA

Este proyecto fue desarrollado con la asistencia de Claude (Anthropic). Como tal:
- El código puede optimizarse
- Pueden existir mejores prácticas
- Se aceptan mejoras y sugerencias

## ☕ Apoya el Proyecto

Si encuentras útil este proyecto y quieres apoyar su desarrollo:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow.svg?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/chugeno)
[![MercadoPago](https://img.shields.io/badge/MercadoPago-Apoya-lightblue.svg?style=flat-square&logo=mercadopago)](https://link.mercadopago.com.ar/eugenioazurmendi)

¡Tu apoyo ayuda a mantener y mejorar TubeVault!

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!
- 🐛 Reporta bugs
- 💡 Sugiere mejoras
- 🔧 Envía pull requests

## 📄 Licencia

MIT License - ver [LICENSE.md](LICENSE.md)

## ⚖️ Descargo de Responsabilidad

Este proyecto es para uso personal y educativo. No fomentes la infracción de derechos de autor.

---
Hecho con ❤️ usando YouTube Data API y TMDB 