# 🎬 TubeVault
> Your Private YouTube Collection

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

TubeVault es una página estática que actúa como un servidor multimedia, permitiéndote acceder y organizar tus videos no listados de YouTube en una interfaz similar a servicios como Plex o Jellyfin. Con TubeVault, puedes crear tu propia colección de películas, series y videos personales, accediendo a ellos de manera fácil y rápida.

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
- Actualización inteligente

## 🚀 Inicio Rápido

### 1️⃣ APIs Necesarias

**YouTube Data API v3**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Habilita YouTube Data API v3
4. Crea credenciales (API Key)

**TMDB API**
1. Crea una cuenta en [TMDB](https://www.themoviedb.org/signup)
2. Ve a la configuración de API
3. Solicita una API Key

### 2️⃣ Configuración

En `scripts/config.js`:

'''
const CONFIG = {
    youtubeApiKey: 'TU_API_KEY_DE_YOUTUBE',
    channelId: 'TU_ID_DE_CANAL',
    tmdbApiKey: 'TU_API_KEY_DE_TMDB',
    updateInterval: 3600000,
    unlistedVideos: [
        "VIDEO_ID_1",
        "VIDEO_ID_2"
    ]
};
'''

## 📝 Uso

### Videos Públicos
1. Súbelos normalmente a YouTube
2. Usa el formato de descripción adecuado
3. Aparecerán en "Mis Videos"

### Videos No Listados
1. Súbelos como "no listados"
2. Usa el formato de descripción
3. Agrega el ID en config.js

## ⚠️ Consideraciones

- Los videos no listados necesitan configuración manual
- YouTube puede eliminar videos que infrinjan derechos
- API tiene límite de 10,000 unidades diarias
- Usar con contenido propio o autorizado

## 🛠️ Instalación

1. Clona el repositorio
2. Configura las API keys
3. Abre index.html

## 🤖 Desarrollo con IA

Este proyecto fue desarrollado con la asistencia de Claude (Anthropic). Como tal:
- El código puede optimizarse
- Pueden existir mejores prácticas
- Se aceptan mejoras y sugerencias

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
