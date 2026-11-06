# Tuppers 🍱

PWA personal para organizar la semana de comidas con tuppers: qué toca hoy, lista de la compra, modo cocina y recetas.
Funciona sin conexión y se actualiza sola al abrirla.

**App:** https://e3develops.github.io/tuppers/

## Añadirla a la pantalla de inicio del iPhone

1. Abre el enlace en **Safari**.
2. Toca **Compartir** (el cuadrado con la flecha; en iOS recientes, primero **···**).
3. Elige **Añadir a pantalla de inicio** y pulsa **Añadir**.
4. Ábrela siempre desde el icono: a pantalla completa y sin conexión.

> El progreso (compra, reserva, ajustes) se guarda en el propio móvil. Lo de Safari y lo de la app instalada van por separado.

## Editar platos

Todo el contenido está en `src/data/data.json`:

- `ciclo`: qué plato 1 (horno) y plato 2 (salsa) toca cada semana del ciclo (1, 2, 3).
- `recetas`: cada receta con `ingredients` (`{ id, name, qty, unit, section }`) y `steps` (`{ text, timerMin, timerLabel }`).
  - Las cantidades son para los `tuppers` de la receta (horno 3, salsa 4).
  - `id` sirve para sumar el mismo producto entre recetas y para enlazar con la `despensa`.
  - `section` es el pasillo del Mercadona: Fruta y verdura, Carne y pescado, Charcutería y huevos, Refrigerados, Panadería, Despensa, Congelados u Otros.
- `planes`: el orden del modo cocina de cada semana (pasos intercalados, con `meanwhile` = "Mientras tanto").
- `comidasFijas`, `productosFijos` (para 1 persona) y `despensa` ("¿Te queda?").

Después: `npm test` (comprueba que todo cuadra) y `git push`. GitHub Actions lo publica solo.

## Desarrollo

```
npm install
npm run dev      # http://localhost:5173/tuppers/
npm test         # tests de la lógica (Vitest)
npm run build
```

Para probar otro día y hora: `http://localhost:5173/tuppers/?fecha=2026-11-18T20:00#/`
