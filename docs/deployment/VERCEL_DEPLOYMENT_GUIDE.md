# Vercel Production Deployment Guide
### EV Market Analysis and Business Intelligence Platform

This project is fully configured for deployment on **Vercel** with full-stack support for the **React 18 + Vite frontend** and **Node.js Express Serverless API functions**.

---

## 1. Architecture on Vercel

```
                                  +---------------------------------------+
                                  |             Vercel Edge               |
                                  |           (Global Anycast)            |
                                  +-------------------+-------------------+
                                                      |
                             +------------------------+------------------------+
                             |                                                 |
                   [Static / SPA Routes]                               [API Routes /api/*]
                             |                                                 |
              +--------------v--------------+                   +--------------v--------------+
              |     React 18 + Vite SPA     |                   |  Node.js Serverless Function|
              |        (client/dist)        |                   |        (api/index.js)       |
              +-----------------------------+                   +--------------+--------------+
                                                                               |
                                                                +--------------v--------------+
                                                                |      Prisma ORM Client      |
                                                                |   (PostgreSQL / SQLite)     |
                                                                +-----------------------------+
```

### Key Configuration Files:
- [vercel.json](file:///C:/Project/vercel.json): Root configuration defining build command (`node scripts/vercel-build.js`), output directory (`client/dist`), and SPA rewrites (`/(.*)` -> `/index.html`, `/api/(.*)` -> `/api/index.js`).
- [api/index.js](file:///C:/Project/api/index.js): Vercel Serverless Function entrypoint wrapping the compiled Express application.
- [client/vercel.json](file:///C:/Project/client/vercel.json): Fallback configuration in case Vercel is set to deploy directly from the `client/` subdirectory.
- [scripts/vercel-build.js](file:///C:/Project/scripts/vercel-build.js): Cross-platform build script that compiles the backend (`tsc`), generates the Prisma client, and builds the Vite production bundle.
- [client/src/services/api.ts](file:///C:/Project/client/src/services/api.ts): Dynamic Axios API base URL supporting `VITE_API_URL` with relative `/api/v1` fallback.

---

## 2. Option A: 2-Minute Deployment via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare full-stack project for Vercel deployment"
   git push origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your Git provider (GitHub) and click **Import** on the `EV-Market` repository.

3. **Configure Project Settings:**
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run vercel-build` (automatically populated from `vercel.json`)
   - **Output Directory:** `client/dist` (automatically populated from `vercel.json`)

4. **Environment Variables (Optional / Recommended):**
   Under **Settings -> Environment Variables**, add:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `JWT_SECRET` | `your_secure_random_jwt_secret_key` | Secret key for JWT signing |
   | `DATABASE_URL` | `postgresql://...` | Connection URL for PostgreSQL (Neon, Supabase, Vercel Postgres) |
   | `VITE_API_URL` | *(leave blank if unified on Vercel)* | External backend URL if hosting API separately |

5. **Click "Deploy":**
   Vercel will run the pipeline, build the assets, and provide you with a live production URL (e.g., `https://ev-market-analysis.vercel.app`).

---

## 3. Option B: Deployment via Vercel CLI

If you prefer deploying directly from your terminal:

1. **Install Vercel CLI globally (one-time):**
   ```bash
   npm install -g vercel
   ```

2. **Authenticate with Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy Preview:**
   ```bash
   vercel
   ```
   Follow the interactive prompts:
   - *Set up and deploy?* **Y**
   - *Which scope?* (Select your Vercel account)
   - *Link to existing project?* **N**
   - *Project name?* `ev-market-analysis`
   - *Directory?* `./`

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

---

## 4. Production Database Configuration (PostgreSQL)

For permanent data storage and multi-instance concurrency on Vercel:

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech), [Supabase.com](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).
2. Copy the pooled connection string (starts with `postgresql://`).
3. In Vercel Project Settings, set:
   ```
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```
4. Push the PostgreSQL schema and seed initial data:
   ```bash
   cd server
   npx prisma db push --schema=prisma/schema.postgres.prisma
   npm run prisma:seed
   ```

---

## 5. Verification Checklist

- [x] Client production build verified (`vite build` creates minified bundles in `client/dist`).
- [x] Server production build verified (`tsc` compiles to `server/dist`).
- [x] TypeScript compiler errors fixed in `admin.controller.ts` and `datasets.controller.ts`.
- [x] Type definitions for `vite-env.d.ts` and `@types/node` configured.
- [x] Automated test suite passing (15/15 unit and integration tests).
- [x] Vercel routing configured (`vercel.json` with rewrites and SPA fallback).
- [x] Serverless function bridge configured in `api/index.js`.
- [x] Git ignore configured for `.vercel` and build artifacts.
