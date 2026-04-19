# SHC — Teleconsulta psicológica

Sistema web de **historias clínicas** y **teleconsulta** con roles **paciente**, **psicólogo (doctor)** y **administrador**.

## Funcionalidades

- **Login** para los tres roles; **registro público** solo para pacientes.
- **Historial clínico**: el paciente lee sus notas; el psicólogo ve pacientes con cita o notas y puede **documentar** nuevas entradas.
- **Citas**: el paciente **programa** con el psicólogo que elija; el psicólogo **confirma, completa o cancela** y puede añadir notas por cita.
- **Chat privado** entre paciente y psicólogo (tras existir al menos **una cita** entre ambos), en tiempo real con **Socket.io**.

## Requisitos

- Node.js 18+
- MySQL 8 (en local, por ejemplo usuario `root` y base `shc_teleconsulta`)

## Puesta en marcha

### 1. Base de datos

Cree el archivo `server/.env` a partir de `server/.env.example` y ajuste usuario/contraseña de MySQL.

Aplique el esquema y datos demo:

```bash
cd server
npm install
npm run seed
```

El *seed* crea la base si no existe e inserta usuarios de prueba (contraseña **`demo123`**):

| Rol       | Email               |
|----------|---------------------|
| Admin    | `admin@shc.local`   |
| Psicóloga| `doctora@shc.local` |
| Psicólogo| `doctor@shc.local`  |
| Paciente | `paciente@shc.local`|

### 2. API (puerto 4000)

```bash
cd server
npm run dev
```

### 3. Interfaz web (puerto 5173)

En otra terminal:

```bash
cd client
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Las peticiones `/api` y WebSocket se proxifican al servidor.

## Estructura

- `sql/schema.sql` — tablas `users`, `doctor_profiles`, `appointments`, `clinical_records`, `messages`.
- `server/` — Express, JWT, MySQL, Socket.io.
- `client/` — React + Vite + TypeScript.

## Producción

Compile el cliente (`cd client && npm run build`) y sirva la carpeta `client/dist` detrás de un proxy que reenvíe `/api` y `/socket.io` al mismo proceso Node que ejecuta `npm start` en `server/`.

Configure `JWT_SECRET` seguro y credenciales MySQL reales en `server/.env`.
