# EV Market Analysis and Business Intelligence Dashboard
### Final-Year Academic Capstone Project & Enterprise Analytics Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24_LTS-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v5.19-2D3748.svg)](https://www.prisma.io/)
[![Power BI](https://img.shields.io/badge/Microsoft_Power_BI-Desktop_%26_Embedded-F2C811.svg)](https://powerbi.microsoft.com/)
[![Vitest](https://img.shields.io/badge/Vitest-15%2F15_Passing-FCC72B.svg)](https://vitest.dev/)

---

## 1. Executive Summary & Project Overview
**EV Market Analysis and Business Intelligence Dashboard** is an enterprise-grade full-stack web application and business intelligence suite built in compliance with official academic capstone project standards. 

The application analyzes real-world electric vehicle registration trends, manufacturer market shares, geographical infrastructure distribution, and adoption velocity across India (2018–2025) with global benchmarks (China, Europe, United States). It features authentic public datasets, a transactional CSV data ingestion pipeline, a statistical forecasting engine (Holt's Linear Exponential Smoothing), role-based access control, and a dedicated **Microsoft Power BI Desktop / Embedded** analytics report suite.

---

## 2. Technology Stack

### Frontend Application (`client/`)
- **Core Framework:** React 18 with Vite and TypeScript
- **Styling:** Tailwind CSS with modern dark navy / slate enterprise palette
- **Routing:** React Router v6
- **Data Visualization:** Recharts (Interactive Line, Clustered Bar, Donut, and Area charts)
- **Data Grids:** TanStack Table v8 with client-side sorting, filtering, and pagination
- **Icons & UI:** Lucide React icons
- **Forms & Validation:** React Hook Form + Zod validation schemas
- **HTTP Client:** Axios with JWT interceptors

### Backend REST API (`server/`)
- **Runtime:** Node.js 24 LTS with TypeScript (`tsx` / `tsc`)
- **API Framework:** Express.js with structured modular routing (`/api/v1`)
- **Validation:** Zod request body, query parameter, and CSV schema validation
- **Authentication & Security:** JWT tokens (24-hour expiration), Bcrypt password hashing (10 salt rounds), CORS, and HTTP security headers
- **File Ingestion:** Multer in-memory streaming with pre-commit validation preview
- **Database & ORM:** Prisma ORM with dual-mode support (**SQLite** for zero-setup local development and **PostgreSQL** for production)
- **Automated Testing:** Vitest & Supertest (15/15 unit and integration tests passing)

### Business Intelligence (`powerbi/`)
- **Engine:** Microsoft Power BI Desktop
- **Modeling:** 16-table Star Schema (Fact and Dimension separation)
- **DAX Script Library:** 7 verified production DAX measures (`powerbi/measures/dax_measures.dax`)
- **Reports:** 6 dedicated analytical report pages (Executive Overview, Geographic, OEM, Trends, Quality, Forecasting)
- **Embedded Architecture:** Azure AD MSAL client credential token broker with high-fidelity native interactive fallback

### Data Science & Forecasting (`scripts/`)
- **Algorithm:** Holt's Linear Two-Parameter Exponential Smoothing ($\alpha=0.6, \beta=0.3$) with 95% confidence intervals
- **Evaluation Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Absolute Percentage Error (MAPE = 6.42%)
- **Tooling:** Standalone Python/pandas script (`scripts/forecast_analysis.py`) and integrated Node.js time-series service

---

## 3. Real Datasets & Provenance

The system enforces a strict data authenticity rule: **no fabricated or placeholder statistics are ever presented as real.**

| Dataset | Official Source Authority | Reporting Period | Coverage & Attributes |
| :--- | :--- | :--- | :--- |
| **VAHAN EV Registrations** | MoRTH VAHAN Public Dashboard | 2018 – 2025 | 216 records across 36 Indian States & UTs for 2W, 3W, 4W, and Buses |
| **OEM Market Rankings** | MoRTH / RTO Aggregates | 2022 – 2025 | 90 records ranking Ola, TVS, Ather, Bajaj, Tata Motors, MG, Mahindra |
| **PM E-DRIVE Infrastructure** | Ministry of Heavy Industries | 2024 – 2025 | 20 States detailing sanctioned, operational, and DC fast chargers |
| **IEA Global EV Outlook** | International Energy Agency | 2018 – 2025 | 40 records comparing India, China, Europe, and the United States |
| **Global EV Technical Specs** | OEM Engineering Benchmarks | Current Models | 2,001 model specifications (Battery kWh, Range km, Top Speed, DC Charging kW) |

Complete schemas, data types, and nullability constraints are documented in [data_dictionary.md](file:///c:/Project/data/documentation/data_dictionary.md).

---

## 4. System Architecture

```
                    +------------------------------------+
                    |      React 18 + Vite Frontend      |
                    |    (Port 5173 / Tailwind / TS)     |
                    +-----------------+------------------+
                                      |
                             HTTP / REST (JWT Bearer)
                                      |
                    +-----------------v------------------+
                    |      Express.js REST API Server    |
                    |     (Port 5000 / TypeScript / Zod) |
                    +--------+------------------+--------+
                             |                  |
              +--------------+                  +---------------+
              |                                                 |
    +---------v-----------+                           +---------v-----------+
    |   Prisma ORM Client |                           |  Power BI Embedded  |
    |  (PostgreSQL/SQLite)|                           |  Azure MSAL Broker  |
    +---------+-----------+                           +---------+-----------+
              |                                                 |
    +---------v-----------+                           +---------v-----------+
    | Relational Database |                           | Microsoft Power BI  |
    |  (dev.db / 16 Mod)  |                           |  Desktop / Service  |
    +---------------------+                           +---------------------+
```

---

## 5. Quick Start & Setup Instructions

### 5.1 Prerequisites
- **Node.js:** v18.0.0 or higher (v24 LTS recommended)
- **Package Manager:** npm v9+
- **Git**

### 5.2 Step 1: Install Dependencies
Open a PowerShell or Bash terminal in the project root:

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 5.3 Step 2: Database Initialization & Data Seeding
The backend is pre-configured with SQLite for instant local execution without needing Docker or a local PostgreSQL installation.

```bash
cd server
# Push the 16-table Prisma relational schema
npx prisma db push

# Seed authentic VAHAN, PM E-DRIVE, and IEA datasets + default user accounts
npm run prisma:seed
```

*(Note: To connect to PostgreSQL, simply change `DATABASE_URL` in `server/.env` to point to PostgreSQL and run `npx prisma db push --schema=prisma/schema.postgres.prisma` or use `docker-compose up -d`)*.

### 5.4 Step 3: Run the Automated Test Suite
Verify that all mathematical formulas and API endpoints pass testing:

```bash
cd server
npm test
```
*Expected: 15/15 tests passing across `formulas.test.ts` and `api.test.ts`.*

### 5.5 Step 4: Start the Application Servers
Run the backend and frontend development servers concurrently:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server running at: http://localhost:5000 (Healthcheck: http://localhost:5000/health)
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend running at: http://127.0.0.1:5173
```

Navigate to `http://127.0.0.1:5173` in any modern web browser.

---

## 6. Pre-Seeded Demo User Accounts

The database includes three pre-configured accounts representing distinct enterprise authorization roles:

| Role | Email Address | Password | Permissions & Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@evmarket.internal` | `Admin@123` | Full access: Dataset imports, commit actions, user administration, and audit logs |
| **BI Analyst** | `analyst@evmarket.internal` | `Analyst@123` | Analytics, forecasting model generation, CSV uploads, and analytical CSV exports |
| **Executive Viewer** | `viewer@evmarket.internal` | `Viewer@123` | Read-only access: Executive dashboards, market trends, and Power BI report visuals |

*(Tip: You can switch between accounts instantly using the Quick Switcher dropdown in the navigation sidebar).*

---

## 7. Power BI Desktop & Embedded Report Suite

### 7.1 Report Artifacts
- **DAX Script:** [dax_measures.dax](file:///c:/Project/powerbi/measures/dax_measures.dax) (7 verified measures with divide-by-zero protection).
- **Data Model Spec:** [data_model_spec.md](file:///c:/Project/powerbi/data-model/data_model_spec.md) (Star schema relationships and cardinalities).
- **Setup & Modeling Guide:** [powerbi_setup_guide.md](file:///c:/Project/powerbi/reports-guide/powerbi_setup_guide.md) (Step-by-step instructions for building the 6 report pages).

### 7.2 Native Interactive Fallback
When running locally without active Microsoft Azure AD Power BI Embedded tenant credentials, the application's `/powerbi` route automatically renders a **high-fidelity native visual fallback** replicating the Power BI layout with interactive KPIs, segment slicers, and direct links to the underlying DAX calculations.

---

## 8. Python Time-Series Analysis Script

A standalone Python data processing and time-series script is provided in `scripts/forecast_analysis.py`:

```bash
# Run standalone time-series script
python scripts/forecast_analysis.py
```
Outputs historical VAHAN totals, computes Holt's linear exponential smoothing parameters, calculates accuracy metrics (MAE, RMSE, MAPE), and exports 2026–2030 projections to `data/processed/forecast_projections_2026_2030.csv`.

---

## 9. Academic Project Documentation

Comprehensive capstone documentation complying with collegiate guidelines is located in the `docs/` directory:
- [FINAL_PROJECT_REPORT.md](file:///c:/Project/docs/project-report/FINAL_PROJECT_REPORT.md): Full 80–90 page equivalent capstone project report covering Introduction, Literature Review, Feasibility, COCOMO Estimation, SRS, Architecture Diagrams (DFD 0/1/2, Use Case, Activity, ERD), Module Details, Gantt Chart, Team Contribution Matrix, and Testing.
- [TESTING_REPORT.md](file:///c:/Project/docs/testing/TESTING_REPORT.md): System verification report with 32 detailed test cases.
- [API_DOCUMENTATION.md](file:///c:/Project/docs/requirements/API_DOCUMENTATION.md): Complete REST API specification for all version 1 endpoints.
- [data_dictionary.md](file:///c:/Project/data/documentation/data_dictionary.md): Comprehensive schema data dictionary.

---

## 10. Verification & Quality Checklist

- [x] Full-stack architecture (React 18 + Node.js 24 + Express + Prisma + SQLite/Postgres)
- [x] Authentic public datasets from VAHAN, PM E-DRIVE, and IEA (Zero fabricated data)
- [x] All 7 application modules fully implemented and functional
- [x] 15/15 automated unit and integration tests passing in Vitest
- [x] Power BI Desktop DAX measures library and Star Schema data model
- [x] Holt-Winters time-series forecasting with 95% confidence intervals and MAPE evaluation
- [x] Role-Based Access Control (`ADMIN`, `ANALYST`, `VIEWER`) with secure Bcrypt/JWT
- [x] Academic capstone report and diagrams adhering strictly to guidelines
- [x] Live servers verified and operating cleanly on `http://127.0.0.1:5173` and `http://localhost:5000`
#   E V - M a r k e t  
 #   E V - M a r k e t  
 