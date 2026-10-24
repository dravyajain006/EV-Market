# Microsoft Power BI Desktop: Complete Report Development & Integration Guide
## Project: EV Market Analysis and Business Intelligence Dashboard

---

### 1. Executive Summary & Prerequisites
This manual provides end-to-end instructions for data analysts, evaluators, and Power BI engineers to build, model, and publish the 6-page **EV Market Analytics Suite** using Power BI Desktop and publish to Power BI Service / React Embedded.

#### Prerequisites
- **Software:** Microsoft Power BI Desktop (Latest 64-bit edition).
- **Data Files:** Cleaned CSV datasets in `c:\Project\data\raw\` or active PostgreSQL instance on `localhost:5432`.
- **DAX Script:** Pre-calculated measure definitions in `c:\Project\powerbi\measures\dax_measures.dax`.
- **Data Model:** Star schema definition in `c:\Project\powerbi\data-model\data_model_spec.md`.

---

### 2. Step 1: Ingesting Datasets into Power Query

1. Open **Microsoft Power BI Desktop**.
2. Click **Get Data** -> **Text/CSV**.
3. Ingest the following 5 CSV files from `c:\Project\data\raw\`:
   - `vahan_india_ev_registrations.csv` -> Rename query to `FactEvRegistrations`
   - `vahan_india_manufacturer_rankings.csv` -> Rename query to `FactManufacturerRankings`
   - `pmedrive_charging_infrastructure.csv` -> Rename query to `FactChargingStations`
   - `iea_global_ev_outlook.csv` -> Rename query to `FactGlobalEvMarket`
   - `ev_market_global_models.csv` -> Rename query to `DimEvModels`

#### Power Query Transformations (M-Code):
- **Set Data Types:**
  - In `FactEvRegistrations`: Ensure `year` is `Int64.Type`, `ev_registrations` is `Int64.Type`, `total_vehicle_registrations` is `Int64.Type`, and `penetration_rate` is `Percentage.Type`.
  - In `FactManufacturerRankings`: Ensure `units_sold` is `Int64.Type`, `market_share` is `Percentage.Type`.
- **Create Dimension Tables:**
  - Create `DimRegion`: Right click `FactEvRegistrations` -> **Reference** -> Select columns `state_code`, `state_name`, `zone` -> **Remove Duplicates**.
  - Create `DimCategory`: Right click `FactEvRegistrations` -> **Reference** -> Select column `category` -> **Remove Duplicates**.
- Click **Close & Apply**.

---

### 3. Step 2: Configuring the Data Model (Model View)

1. Navigate to the **Model View** tab in Power BI Desktop.
2. Arrange tables into a clean Star Schema:
   - Place `DimRegion` and `DimCategory` at the top.
   - Place `FactEvRegistrations`, `FactManufacturerRankings`, and `FactChargingStations` in the center.
3. Validate Relationships:
   - `DimRegion[state_code]` **(1) -> (*) `FactEvRegistrations[state_code]`** (Cardinality: 1:*, Cross filter: Single)
   - `DimCategory[category]` **(1) -> (*) `FactEvRegistrations[category]`** (Cardinality: 1:*, Cross filter: Single)
   - `DimRegion[state_code]` **(1) -> (*) `FactChargingStations[state_code]`** (Cardinality: 1:*, Cross filter: Single)
   - `DimCategory[category]` **(1) -> (*) `FactManufacturerRankings[category]`** (Cardinality: 1:*, Cross filter: Single)

---

### 4. Step 3: Loading DAX Measures

1. Create a dedicated measure container: Click **Enter Data** -> Name table `_DAX_Measures` -> Click **Load**.
2. Open `c:\Project\powerbi\measures\dax_measures.dax` and paste the measures:
   - `Total EV Registrations = SUM(FactEvRegistrations[ev_registrations])`
   - `Total All-Fuel Registrations = SUM(FactEvRegistrations[total_vehicle_registrations])`
   - `EV Penetration Rate % = DIVIDE([Total EV Registrations], [Total All-Fuel Registrations], 0)`
   - `Previous Year EV Registrations = CALCULATE([Total EV Registrations], SAMEPERIODLASTYEAR('DimDate'[Date]))`
   - `YoY Registration Growth % = DIVIDE([Total EV Registrations] - [Previous Year EV Registrations], [Previous Year EV Registrations], 0)`
   - `Data Completeness % = DIVIDE(COUNTROWS(FILTER(FactEvRegistrations, NOT(ISBLANK(FactEvRegistrations[ev_registrations])))), COUNTROWS(FactEvRegistrations), 0)`

---

### 5. Step 4: Building the 6 Dedicated Report Pages

#### Page 1: Executive Overview
- **Visuals:**
  - 4 Card Visuals: `Total EV Registrations`, `National Penetration %`, `YoY Growth %`, `Operational Charging Stations`.
  - Line & Clustered Column Chart: Total EV Registrations vs YoY Growth % across Years (2018–2025).
  - Donut Chart: Registrations by Vehicle Category (`2W`, `3W`, `4W`, `BUS`).
  - Top 5 Horizontal Bar Chart: Leading States by Total EV volume.
  - Slicers: Year dropdown, State multi-select slicer.

#### Page 2: Geographic EV Analysis
- **Visuals:**
  - Azure Map / Filled Map: Shaded by `EV Penetration Rate %` with bubble size mapped to `Total EV Registrations`.
  - Matrix Table: State Name, Total Registrations, Penetration Rate, Public Fast Chargers, Chargers per 1,000 EVs.
  - Scatter Plot: EV Registrations (X-axis) vs Public DC Fast Chargers (Y-axis) highlighting infrastructure readiness.

#### Page 3: Manufacturer & Segment Analysis
- **Visuals:**
  - 100% Stacked Bar Chart: OEM Market Share by Category (`2W`: Ola, TVS, Ather, Bajaj; `4W`: Tata, MG, Mahindra).
  - Clustered Bar Chart: Annual OEM Units Sold ranked 1 through 10.
  - Segment Treemap: Market volume proportion across 2-Wheelers, 3-Wheelers, and 4-Wheelers.

#### Page 4: Historical Trends & Growth Rates
- **Visuals:**
  - Multi-line Trend Chart: Segment adoption trajectory over 8 years (2018–2025).
  - Waterfall Chart: Cumulative EV fleet addition breakdown by fiscal year.
  - Table: Annual CAGR calculation, baseline comparison, and volume delta.

#### Page 5: Data Quality, Completeness & Provenance
- **Visuals:**
  - Radial Gauge Visual: `Data Completeness %` (Target: 98.5%).
  - Card Visuals: Total Rows Processed (216 state records, 90 OEM records, 20 infrastructure records).
  - Table: Registry Source (`VAHAN Public Dashboard`, `PM E-DRIVE`, `IEA`), Retrieval Date, License (`Open Government Data License India`), Record Count, Verification Status (`CLEANED & VALIDATED`).

#### Page 6: Forecasting & Scenario Analysis
- **Visuals:**
  - Power BI Analytics Line Chart: Actual series (2018–2025) + Holt's Exponential Forecast (2026–2030) with 95% Confidence Upper and Lower Bands.
  - What-If Parameter Slicer: "Target Penetration by 2030" (e.g. 30% NITI Aayog target) showing required annual adoption rate.

---

### 6. Step 5: Power BI Embedded Integration with React Frontend

The application includes a production-grade token broker in the Express backend:
1. **Endpoint:** `POST /api/v1/powerbi/embed-config`
   - Accepts report ID and workspace ID.
   - Generates Azure AD MSAL client credential bearer token via Azure Power BI REST API (`https://api.powerbi.com/v1.0/myorg/GenerateToken`).
   - Returns secure `embedToken`, `embedUrl`, and expiry timestamp.
2. **React Client (`PowerBIPage.tsx`):**
   - Connects to `/api/v1/powerbi/reports` to list registered reports.
   - When credentials or tenant access are available, initializes the official `powerbi-client` JavaScript SDK inside an interactive container.
   - When running locally without active Azure tenant credentials, automatically displays a **high-fidelity native visual fallback** with interactive KPIs, segment slicers, and direct download links to the `.pbix` template and DAX scripts.

---

### 7. Verification Checklist
- [x] All 5 CSV tables imported and formatted.
- [x] Star schema relationships validated in Model view (1:*).
- [x] DAX formulas match backend API formulas (`DIVIDE` with zero denominators).
- [x] 6 dedicated report pages configured with slicers and cards.
- [x] Fallback mode verified in React web dashboard (`/powerbi`).
