# Decisiones y limitaciones

- Grimorio usa JavaScript moderno con módulos ES. Se descartó TypeScript por decisión del proyecto; los contratos se protegen con validación en tiempo de ejecución.
- Vite aporta servidor, recarga y construcción sin imponer un framework.
- El catálogo incluido continúa en JSON; las recetas personales y el menú se guardan en IndexedDB, con `localStorage` como respaldo y migración del formato anterior.
- La interfaz se mantiene en DOM nativo. Adoptar un framework solo se reconsiderará si medir el renderizado o el crecimiento de componentes lo justifica.
- La PWA usa una estrategia de red con respaldo en caché. El primer uso necesita conexión para completar la caché del paquete generado.
- Los ingredientes personalizados deben elegir identificadores existentes del catálogo de equivalencias; un editor de equivalencias queda fuera del alcance actual.
