# Guía para agentes (Frontend)

## Estructura del proyecto

- Proyecto Next.js App Router.
- Rutas y layouts en `app/` (`layout.tsx`, `page.tsx`).
- Utilidades y clientes en `lib/` (ver `lib/utils.ts`).
- Componentes reutilizables en `components/`.
- Assets en `public/`.
- Alias: `@/*` apunta a la raíz.

## Comandos de desarrollo, build y lint

- `npm run dev`: servidor local en `http://localhost:3000`.
- `npm run build`: build de producción.
- `npm run start`: server de producción (requiere `npm run build`).
- `npm run lint`: ESLint con reglas de Next.js.

## Tests

- No hay framework de tests configurado.
- Si se agrega, documentar scripts en `package.json` y el patrón de nombres.

## Estilo de código y convenciones

- TypeScript estricto habilitado en `tsconfig.json`.
- Mantener el estilo del archivo existente (comillas dobles, semicolons según archivo).
- Imports: React/externos primero, luego `@/`, luego relativos.
- Componentes: `PascalCase` para archivos `.tsx` y exportaciones.
- Hooks y helpers: `camelCase`.
- Rutas: seguir convención App Router (`app/**/page.tsx`).
- Cliente/servidor: agregar `"use client"` solo cuando sea necesario.
- Evitar `fetch` ad-hoc; usar `lib/api/request.ts` y el patrón `ApiError`.

## Manejo de errores

- Usar `apiRequest`/`apiClient` para requests.
- Mostrar errores con `toast` cuando corresponda (evitar duplicar lógica).

## Configuración y seguridad

- Mantener secretos en `.env`/`.env.development` locales.
- No commitear `.env` ni artefactos de build (`.next/`, `node_modules/`).

## Estado funcional actual (referencia)

Leyenda:
- `IMPLEMENTADO`: funcionalidad operativa y evidenciada.
- `PARCIAL`: UI o lógica incompleta / riesgo operativo.
- `NO_IMPLEMENTADO`: no existe implementación funcional.
- `MODELO_SIN_UI`: existe en modelo de datos pero no expuesto funcionalmente.

Resumen por módulo:
- Inventario Animal: registro/identificadores/historial OK; ubicación/auditoría parcial; manga sin implementar.
- Fincas: CRUD OK; multi-finca parcial.
- Potreros y Pastoreo: CRUD y mapas OK; ocupación parcial; historial/rotación/alertas no implementado.
- Lotes: CRUD y asignación OK; trazabilidad parcial.
- Movimientos y Trazabilidad: registro/motivo OK; historial y auditoría parcial/no implementado.
- Reproducción: servicios en modelo; palpaciones, días abiertos, intervalos, semáforo, historial no implementado.
- Sanidad: eventos en modelo; plan de vacunación y medicamentos parcial; retiro/alertas no implementado.
- Producción de Leche: producción en modelo; conciliación e historial no implementado.
- Nacimientos: registro/alertas/impacto inventario no implementado.
- Finanzas: transacciones en modelo; multi-moneda/análisis/integración no implementado.
