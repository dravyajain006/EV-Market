# REST API Specification & Endpoints Reference
## EV Market Analysis and Business Intelligence Platform (v1)

Base URL: `http://localhost:5000/api/v1`
Authentication: Bearer Token (JSON Web Token) in `Authorization` header (`Authorization: Bearer <token>`)

---

### Table of Contents
1. [Authentication Endpoints (`/auth`)](#1-authentication-endpoints-auth)
2. [Analytics Endpoints (`/analytics`)](#2-analytics-endpoints-analytics)
3. [Dataset Management Endpoints (`/datasets`)](#3-dataset-management-endpoints-datasets)
4. [Forecasting Endpoints (`/forecasts`)](#4-forecasting-endpoints-forecasts)
5. [Power BI Embedded Endpoints (`/powerbi`)](#5-power-bi-embedded-endpoints-powerbi)
6. [Administration Endpoints (`/admin`)](#6-administration-endpoints-admin)

---

### 1. Authentication Endpoints (`/auth`)

#### `POST /auth/login`
Authenticates a user and issues a JWT token.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@evmarket.internal",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-admin-01",
      "email": "admin@evmarket.internal",
      "fullName": "System Administrator",
      "role": "ADMIN"
    }
  }
  ```
- **Error Responses:** `401 Unauthorized` (Invalid credentials), `400 Bad Request` (Zod validation error).

#### `POST /auth/logout`
Terminates user session and logs audit trail.
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  { "success": true, "message": "Successfully logged out" }
  ```

#### `GET /auth/me`
Retrieves currently authenticated user profile.
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-admin-01",
      "email": "admin@evmarket.internal",
      "fullName": "System Administrator",
      "role": "ADMIN"
    }
  }
  ```

---

### 2. Analytics Endpoints (`/analytics`)

#### `GET /analytics/overview`
Retrieves national EV market summary KPIs, YoY growth, and top state volumes.
- **Access:** Authenticated (Any role)
- **Query Parameters:**
  - `year` (optional, integer): Filter to specific calendar year (e.g., `2024`).
  - `category` (optional, string): Filter by vehicle category (`2W`, `3W`, `4W`, `BUS`).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "summary": {
      "totalEvRegistrations": 3335720,
      "totalAllRegistrations": 22416000,
      "evPenetrationRate": 14.88,
      "yoyGrowth": 26.60,
      "totalRegions": 36,
      "operationalChargingStations": 16420,
      "lastUpdated": "2025-03-31T00:00:00.000Z"
    },
    "categoryBreakdown": [
      { "category": "2W", "registrations": 1867000, "share": 55.97 },
      { "category": "3W", "registrations": 1267500, "share": 38.00 },
      { "category": "4W", "registrations": 166780, "share": 5.00 },
      { "category": "BUS", "registrations": 34440, "share": 1.03 }
    ],
    "topStates": [
      { "stateCode": "MH", "stateName": "Maharashtra", "evRegistrations": 625400 },
      { "stateCode": "UP", "stateName": "Uttar Pradesh", "evRegistrations": 542100 },
      { "stateCode": "KA", "stateName": "Karnataka", "evRegistrations": 412800 }
    ]
  }
  ```

#### `GET /analytics/trends`
Retrieves chronological registration and penetration trend series from 2018 to 2025.
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "trends": [
      { "year": 2018, "evRegistrations": 131554, "totalRegistrations": 3120000, "penetrationRate": 4.22, "yoyGrowth": 0.0 },
      { "year": 2024, "evRegistrations": 1950420, "totalRegistrations": 10500000, "penetrationRate": 18.58, "yoyGrowth": 27.50 }
    ]
  }
  ```

#### `GET /analytics/regions`
Retrieves state-wise aggregated registrations, penetration rates, and charging infrastructure.
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "regions": [
      {
        "stateCode": "MH",
        "stateName": "Maharashtra",
        "zone": "West",
        "evRegistrations": 625400,
        "penetrationRate": 16.40,
        "publicStations": 3150,
        "dcFastChargers": 1820
      }
    ]
  }
  ```

#### `GET /analytics/manufacturers`
Retrieves OEM annual sales volumes, rankings, and segment market shares.
- **Access:** Authenticated
- **Query Parameters:**
  - `year` (optional): Filter by year.
  - `category` (optional): Filter by vehicle segment (`2W`, `4W`).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "rankings": [
      { "rank": 1, "manufacturer": "Ola Electric", "category": "2W", "unitsSold": 328000, "marketShare": 38.5 },
      { "rank": 1, "manufacturer": "Tata Motors", "category": "4W", "unitsSold": 71400, "marketShare": 68.19 }
    ]
  }
  ```

#### `GET /analytics/global`
Retrieves international EV market comparison indicators from the IEA Global EV Data Explorer.
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "global": [
      { "region": "China", "year": 2024, "evSales": 8100000, "evSharePct": 38.0 },
      { "region": "Europe", "year": 2024, "evSales": 3200000, "evSharePct": 23.5 },
      { "region": "India", "year": 2024, "evSales": 1950420, "evSharePct": 18.58 }
    ]
  }
  ```

---

### 3. Dataset Management Endpoints (`/datasets`)

#### `POST /api/v1/datasets/upload`
Uploads a candidate CSV file for pre-import schema validation.
- **Access:** Authenticated (`ADMIN`, `ANALYST`)
- **Content-Type:** `multipart/form-data` (Field name: `file`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "stagingId": "stg-8472-a1",
    "filename": "vahan_update_2025.csv",
    "totalRows": 216,
    "validRows": 216,
    "errorRows": 0,
    "preview": [ ... ],
    "errors": []
  }
  ```

#### `POST /api/v1/datasets/commit`
Commits a pre-validated staging dataset into the production database within a transactional boundary.
- **Access:** Authenticated (`ADMIN`)
- **Request Body:**
  ```json
  { "stagingId": "stg-8472-a1" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "importJobId": "job-9912",
    "recordsCommitted": 216,
    "message": "Successfully committed records into production."
  }
  ```

#### `GET /api/v1/datasets/quality`
Returns registry data quality scorecards, missing field tallies, and completeness metrics.
- **Access:** Authenticated

---

### 4. Forecasting Endpoints (`/forecasts`)

#### `POST /api/v1/forecasts/calculate`
Executes Holt's Linear Exponential Smoothing across historical series.
- **Access:** Authenticated (`ADMIN`, `ANALYST`)
- **Request Body:**
  ```json
  {
    "alpha": 0.60,
    "beta": 0.30,
    "horizon": 5
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "model": "Holt's Linear Exponential Smoothing",
    "evaluation": { "mae": 41250.20, "rmse": 52100.80, "mape": 6.42 },
    "projections": [
      { "year": 2026, "forecast": 2410000, "lowerBound95": 2190000, "upperBound95": 2630000 },
      { "year": 2030, "forecast": 4250000, "lowerBound95": 3680000, "upperBound95": 4820000 }
    ]
  }
  ```

---

### 5. Power BI Embedded Endpoints (`/powerbi`)

#### `GET /api/v1/powerbi/reports`
Lists configured Power BI reports, workspaces, and dataset identifiers.
- **Access:** Authenticated

#### `POST /api/v1/powerbi/embed-config`
Generates an Azure AD MSAL embed token for client-side embedding.
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "isConfigured": false,
    "message": "Running in offline/native visual fallback mode.",
    "embedToken": null,
    "embedUrl": null
  }
  ```

---

### 6. Administration Endpoints (`/admin`)

#### `GET /api/v1/admin/users`
Lists all user accounts and active statuses.
- **Access:** Authenticated (`ADMIN` only)

#### `PATCH /api/v1/admin/users/:id/role`
Updates a user's authorization role.
- **Access:** Authenticated (`ADMIN` only)
- **Request Body:** `{ "role": "ANALYST" }`

#### `GET /api/v1/admin/audit-logs`
Retrieves chronological system audit logs.
- **Access:** Authenticated (`ADMIN` only)

#### `GET /api/v1/admin/export-csv`
Streams a formatted CSV download of filtered analytical records.
- **Access:** Authenticated (`ADMIN`, `ANALYST`)
