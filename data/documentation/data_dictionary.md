# EV Market Analytics & BI Platform — Data Dictionary & Provenance

## 1. Overview & Data Provenance
This document establishes the official data dictionary, schema definitions, grain of analytical tables, field validation rules, and provenance for the **EV Market Analysis and Business Intelligence Dashboard**.

All analytical models, backend APIs, React visualizations, and Power BI DAX calculations conform to the definitions herein.

| Dataset Identifier | Source Organization | Source URL | Retrieval / Verification Date | License / Access Type | Grain / Frequency |
|---|---|---|---|---|---|
| `VAHAN_REG_IN` | Ministry of Road Transport & Highways (MoRTH), Govt of India | https://www.analytics.parivahan.gov.in/analytics/publicdashboard/vahan?lang=en | October 2026 | Open Government Data (OGD) Public Dashboard | State × Category × Year |
| `VAHAN_OEM_IN` | VAHAN National Register / FADA India Research | https://www.analytics.parivahan.gov.in/analytics/publicdashboard/vahan?lang=en | October 2026 | Public Regulatory Disclosures | Manufacturer × Category × Year |
| `PM_EDRIVE_INFRA` | Ministry of Heavy Industries, Govt of India | https://pmedrive.heavyindustries.gov.in/dashboard-home | October 2026 | Official Scheme Dashboard | State × Infrastructure Metric |
| `IEA_GLOBAL_EV` | International Energy Agency (IEA) | https://www.iea.org/data-and-statistics/data-tools/global-ev-data-explorer | October 2026 | IEA Open Data License (CC-BY 4.0) | Region × Powertrain × Year |
| `EV_MODELS_GLOBAL` | Global EV Specifications & Benchmark Repository | Cleaned internal benchmark repository | October 2026 | Open Dataset for Educational/Analytical Use | Vehicle Model × Variant |

---

## 2. Table Specifications & Data Dictionaries

### 2.1 Table: `dim_regions`
- **Grain**: One record per Indian State / Union Territory.
- **Primary Key**: `id` (CUID/UUID)
- **Unique Key**: `state_code`

| Column Name | Data Type | Nullable | Description & Constraints | Sample Values |
|---|---|---|---|---|
| `id` | String | No | Primary Key | `reg_mh_01` |
| `state_code` | String(4) | No | ISO 3166-2:IN state code, uppercase | `MH`, `KA`, `DL` |
| `state_name` | String(64) | No | Official name of state or UT | `Maharashtra`, `Delhi` |
| `zone` | String(16) | No | Geographical zone (`North`, `South`, `West`, `East`, `Central`, `North-East`) | `West`, `South` |
| `capital` | String(64) | Yes | Capital city | `Mumbai`, `Bengaluru` |
| `ev_policy_active` | Boolean | No | Indicates whether active dedicated EV policy is gazetted | `true` |

### 2.2 Table: `dim_categories`
- **Grain**: One record per vehicle segment defined under Central Motor Vehicle Rules (CMVR).
- **Primary Key**: `id`
- **Unique Key**: `category_code`

| Column Name | Data Type | Nullable | Description & Constraints | Sample Values |
|---|---|---|---|---|
| `id` | String | No | Primary Key | `cat_2w` |
| `category_code` | String(16) | No | `2W`, `3W`, `4W`, `BUS`, `COMMERCIAL` | `2W` |
| `category_name` | String(64) | No | Descriptive category name | `Electric Two-Wheeler (E-2W)` |
| `description` | String(255) | Yes | CMVR definition / segment classification | `Electric Scooters and Motorcycles` |
| `fame_subsidy_eligible` | Boolean | No | Eligibility under FAME II / PM E-DRIVE subsidy | `true` |

### 2.3 Table: `dim_manufacturers`
- **Grain**: One record per Original Equipment Manufacturer (OEM).
- **Primary Key**: `id`
- **Unique Key**: `name`

| Column Name | Data Type | Nullable | Description & Constraints | Sample Values |
|---|---|---|---|---|
| `id` | String | No | Primary Key | `oem_tata` |
| `name` | String(128) | No | Official corporate entity / brand name | `Tata Motors Passenger Vehicles` |
| `origin_country` | String(64) | No | Country of primary corporate domicile | `India` |
| `headquarters` | String(64) | Yes | City of headquarters | `Mumbai` |
| `is_indian_oem` | Boolean | No | True if domestic OEM | `true` |

### 2.4 Table: `fact_ev_registrations`
- **Grain**: One record per State (`region_id`) × Vehicle Category (`category_id`) × Calendar Year (`year`).
- **Primary Key**: `id`
- **Unique Constraint**: `(region_id, category_id, year)`

| Column Name | Data Type | Nullable | Description & Formula | Constraints / Validation |
|---|---|---|---|---|
| `id` | String | No | Unique surrogate key | Primary Key |
| `region_id` | String | No | Foreign key -> `dim_regions.id` | Must exist |
| `category_id` | String | No | Foreign key -> `dim_categories.id` | Must exist |
| `year` | Integer | No | Calendar Year of registration | `2018 <= year <= 2030` |
| `ev_registrations` | Integer | No | Count of newly registered battery electric vehicles | `>= 0` |
| `total_vehicle_registrations` | Integer | No | Count of all registered vehicles (ICE + EV + Hybrid) | `>= ev_registrations` |
| `ev_penetration_pct` | Decimal(6,3) | No | `(ev_registrations / total_vehicle_registrations) * 100` | `0.0 <= val <= 100.0` |
| `yoy_growth_pct` | Decimal(8,2) | Yes | `((EV_t - EV_{t-1}) / EV_{t-1}) * 100` | Safe on zero denominator |
| `data_source` | String(64) | No | Name of provenance source | `VAHAN_PUBLIC_DASHBOARD` |

### 2.5 Table: `fact_charging_stations`
- **Grain**: One record per State (`region_id`) summarizing charging infrastructure.
- **Primary Key**: `id`
- **Unique Key**: `region_id`

| Column Name | Data Type | Nullable | Description | Validation |
|---|---|---|---|---|
| `id` | String | No | Surrogate key | Primary Key |
| `region_id` | String | No | Foreign key -> `dim_regions.id` | Must exist |
| `sanctioned_stations` | Integer | No | Total public charging stations sanctioned under schemes | `>= 0` |
| `operational_stations` | Integer | No | Total commissioned and active public charging stations | `<= sanctioned_stations` |
| `fast_chargers_dc` | Integer | No | CCS2 / CHAdeMO DC Fast Chargers (>=50kW) | `>= 0` |
| `slow_chargers_ac` | Integer | No | Type-2 / Bharat AC-001 Slow Chargers (<=22kW) | `>= 0` |
| `highway_corridor_chargers` | Integer | No | Fast charging stations located on National Highways | `>= 0` |
| `commissioning_rate_pct` | Decimal(5,2)| No | `(operational_stations / sanctioned_stations) * 100` | `0.0 <= val <= 100.0` |

### 2.6 Table: `fact_global_ev_market`
- **Grain**: One record per Global Region × Calendar Year × Powertrain.
- **Primary Key**: `id`

| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `id` | String | No | Surrogate key |
| `region` | String(64) | No | `China`, `Europe`, `United States`, `India`, `Rest of World` |
| `year` | Integer | No | Calendar year |
| `powertrain` | String(16) | No | `BEV`, `PHEV` |
| `vehicle_type` | String(32) | No | `Cars`, `2/3W`, `Commercial`, `All` |
| `annual_sales_thousands`| Decimal(10,2)| No | Annual vehicle sales in thousands |
| `stock_thousands` | Decimal(12,2)| No | Total cumulative vehicle stock in thousands |
| `ev_sales_share_pct` | Decimal(5,2)| No | EV market share as percentage of total passenger car sales |

---

## 3. Mathematical & Business Logic Specifications

### 3.1 EV Penetration Rate Formula
$$\text{EV Penetration (\%)} = \left( \frac{\text{Eligible EV Registrations in Market } (m, t)}{\text{Total Vehicle Registrations in Market } (m, t)} \right) \times 100$$
*Validation Guardrail*: If $\text{Total Vehicle Registrations} = 0$, return $0.00\%$ and log a data incompleteness flag. Never divide by zero.

### 3.2 Year-over-Year (YoY) Growth Formula
$$\text{YoY Growth (\%)} = \left( \frac{V_t - V_{t-1}}{V_{t-1}} \right) \times 100$$
*Validation Guardrail*: If $V_{t-1} = 0$ or no comparable historical baseline exists (e.g., initial baseline year 2018), report `null` or `0.00%` with baseline indicator `INITIAL_OBSERVATION`.

### 3.3 Manufacturer Market Share Formula
$$\text{Manufacturer Share (\%)} = \left( \frac{\text{OEM EV Registrations in Category } (c, t)}{\text{Total EV Registrations in Category } (c, t)} \right) \times 100$$

### 3.4 Data Completeness Score Formula
$$\text{Data Completeness (\%)} = \left( \frac{\sum \text{Non-Null Mandatory Field Values}}{\text{Total Expected Field Values}} \right) \times 100$$

---

## 4. Ingestion Pipeline & Quality Assurance Policy
1. **Raw File Immobility**: Raw uploaded CSVs are archived in `data/raw/` with SHA-256 checksums and immutable audit timestamps.
2. **Schema Validation**: Every uploaded dataset is strictly parsed using Zod against `DatasetUploadSchema`.
3. **Safe Transactional Import**: Inserts execute inside database transactions. If any fatal constraint fails, the entire transaction rolls back and an `ImportError` log is generated with line number and offending value.
4. **Data Freshness Tracker**: The system maintains `last_refreshed_at` on every fact table and provides visible timestamps on all dashboard cards.
