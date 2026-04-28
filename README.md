# SHC — Teleconsulta psicológica

Sistema web de **historias clínicas** y **teleconsulta** con roles **paciente**, **psicólogo (doctor)** y **administrador**.

Los datos se guardan en un **archivo JSON** en disco (no requiere MySQL).

## Funcionalidades

- **Login** para los tres roles; **registro público** solo para pacientes.
- **Historial clínico**, **citas**, **chat** en tiempo real (Socket.io).
- **Panel admin**: usuarios, alta de psicólogos, estadísticas.

## Requisitos

- Node.js 18+

## Puesta en marcha

### 1. Datos (JSON)

```bash
cd server
npm install
npm run seed
```

Crea `server/data/shc-data.json` con usuarios demo (contraseña de la web **`demo123`**):

| Rol       | Email               |
|----------|---------------------|
| Admin    | `admin@shc.local`   |
| Psicóloga| `doctora@shc.local` |
| Psicólogo| `doctor@shc.local`  |
| Paciente | `paciente@shc.local`|

Copie `server/.env.example` a `server/.env`. Opcional: variable **`JSON_DB_PATH`** (por defecto `./data/shc-data.json` relativo a la carpeta `server/`).

Para **empezar de cero**, borre `server/data/shc-data.json` y ejecute `npm run seed` otra vez.

### 2. API (puerto 4000)

```bash
cd server
npm run dev
```

### 3. Interfaz (puerto 5173)

```bash
cd client
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

## Estructura

- `server/data/` — archivo `shc-data.json` generado por el *seed* (ignorado en git salvo `.gitkeep`).
- `server/src/store/jsonStore.js` — lectura/escritura en cola del JSON.
- `sql/` — scripts de referencia si en el futuro migra a MySQL.
- `client/` — React + Vite.

## Producción

`JWT_SECRET` seguro; no suba `server/data/shc-data.json` con datos reales a repositorios públicos sin cifrado previo.
