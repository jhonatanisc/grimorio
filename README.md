# Grimorio

Planeador semanal de recetas, lista de compras con cantidades y catálogo personal. Está hecho con JavaScript modular, Vite e IndexedDB, sin framework ni TypeScript.

## Requisitos y ejecución

- Node.js 20.19+ o 22.12+
- `npm install`
- `npm run dev` y abrir la dirección indicada por Vite

Para simular producción:

```bash
npm run build
npm run preview
```

## Funciones

- Planeación de siete días con desayuno, comida, colación y cena.
- Asignación, cambio, eliminación y autollenado compatible.
- Búsqueda, filtros y recetas favoritas.
- Recetas personales: crear, editar, duplicar y eliminar.
- Lista agrupada que suma porciones y permite multiplicar comensales.
- Respaldo completo con importación validada y migración del formato anterior.
- Persistencia en IndexedDB con respaldo local, deshacer, navegación por teclado y alternativa al portapapeles.
- PWA instalable y disponible sin conexión después de la primera carga.

## Calidad

```bash
npm test
npm run lint
npm run format:check
```

La arquitectura está separada en `src/domain`, `src/services`, `src/ui` y `src/styles`. Las decisiones están en [docs/DECISIONES.md](docs/DECISIONES.md) y la revisión manual en [docs/REGRESION.md](docs/REGRESION.md).
