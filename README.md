# Dashboard, Reporting & Analytics Management System

> **Neirah Tech Solutions (Sri Lanka)** — Software Engineering Internship Technical Specification & Assessment Implementation.

A high-performance, secure, enterprise-grade multi-role operational analytics and reporting dashboard built with **NestJS**, **PostgreSQL**, **Prisma ORM**, **React**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

---

## 1. System Architecture & Tech Stack

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React 18 + TypeScript + Vite)"]
        UI["Tailwind CSS + Lucide Icons UI"]
        RC["Recharts Visualizations"]
        Store["Auth & Dashboard Context State"]
        UI --> RC
        UI --> Store
    end

    subgraph API_Gateway ["REST API Gateway (/api)"]
        Guards["JwtAuthGuard + RolesGuard + BranchScopeGuard"]
        Validation["ValidationPipe (class-validator)"]
        CSVDefense["CSV Formula Injection Escaper"]
    end

    subgraph Backend ["Backend Modules (NestJS + TypeScript)"]
        AuthMod["AuthModule (JWT & RBAC)"]
        DashMod["DashboardModule (KPIs & Trends)"]
        RepMod["ReportsModule (Aggregation & Export Engine)"]
        AdminMod["AdminModule (Data Inspection)"]
        BranchMod["BranchesModule (Scoped Discovery)"]
    end

    subgraph Database ["PostgreSQL (Relational Store)"]
        Prisma["Prisma ORM (Client 7.x)"]
        Tables["Branch · Staff · User · ServiceTicket · Transaction · SavedReport · DashboardPreference · ReportExportLog"]
        Prisma --> Tables
    end

    Frontend -->|Bearer JWT HTTP/REST| API_Gateway
    API_Gateway --> Backend
    Backend --> Prisma
```

### Technology Stack:
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Passport JWT, Bcrypt, Class-Validator, Class-Transformer, Jest, Supertest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts (Pie/Donut, Area/Line, Bar), Lucide React.
- **Security**: Strict Role-Based Access Control (RBAC), multi-tenant Branch Scoping, Private Report Ownership Protection, CSV Formula Injection Defense (`=`, `+`, `-`, `@`), and 10,000-row export circuit breaker.

---

## 2. Seeded Test Accounts

The operational dataset is pre-seeded with 5 realistic accounts covering all 4 system roles and branch scopes:

| Role | Email | Password | Branch Scoping | Key Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRATOR** | `admin@neirahtech.com` | `admin12345678` | **Organization-Wide** (All Branches) | Full read/write, Admin Data Preview, Report Management, CSV Export |
| **MANAGER** | `manager.colombo@neirahtech.com` | `manager12345678` | **Branch Scoped** (`Colombo HQ`) | Branch-restricted dashboard & reports. Cross-branch access rejected (403) |
| **MANAGER** | `manager.global@neirahtech.com` | `manager12345678` | **Organization-Wide** (All Branches) | Organization-wide dashboard KPIs, trends, and saved reports |
| **ANALYST** | `analyst@neirahtech.com` | `analyst12345678` | **Organization-Wide** (All Branches) | Report Explorer query builder, Saved Reports CRUD, CSV Data Export |
| **VIEWER** | `viewer@neirahtech.com` | `viewer12345678` | **Organization-Wide** (Read-Only) | Dashboard & report viewing only. Cannot edit, create, or export (403) |

> **Quick Login Tip**: The frontend login page features **1-click quick-fill buttons** for each of these test accounts.

---

## 3. Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or v20.x
- **PostgreSQL**: v14.x or newer running on `localhost:5432`
- **npm**: v9.x or newer

### Step 1: Database Setup
Create the target database in PostgreSQL:
```sql
CREATE DATABASE dashboard_reporting_analytics;
```

### Step 2: Backend Setup & Seeding
Navigate to the `backend` directory, configure environment variables, run migrations, and execute the operational seed script:

```bash
cd backend
cp .env.example .env
# Verify your DATABASE_URL in .env matches your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/dashboard_reporting_analytics?schema=public"

npm install
npx prisma generate
npx prisma migrate dev --name init_spec_models
npm run seed
```

*The seed script populates 4 branches, 10 staff members, 5 role-based user accounts, 36 realistic service tickets, 75 financial transactions across 2026, default saved reports, and user dashboard preferences.*

### Step 3: Run the Backend Server
```bash
# In the backend directory:
npm run start:dev
# Backend runs on http://localhost:3000 (API prefix: http://localhost:3000/api)
```

### Step 4: Frontend Setup & Launch
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 4. REST API Specification

All endpoints are hosted under `/api`. All endpoints except `POST /api/auth/login` require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Allowed Roles | Description & Query Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns JWT, user profile, and `branchId`. |
| `GET` | `/api/dashboard/summary` | All Roles | Computes 6 primary KPIs: total, open, resolved tickets, avg resolution time (hrs), completed transaction revenue (LKR), and transaction count. Params: `from`, `to`, `branchId`. |
| `GET` | `/api/dashboard/trends` | All Roles | Chronological monthly time-series of ticket counts and transaction volume. Params: `from`, `to`, `branchId`. |
| `GET` | `/api/dashboard/breakdown` | All Roles | Multi-dimensional breakdowns: status donut, branch bar, priority, category. Params: `from`, `to`, `branchId`. |
| `GET` | `/api/dashboard/preferences`| All Roles | Retrieves authenticated user's widget ordering and card/chart visibility. |
| `PUT` | `/api/dashboard/preferences`| All Roles | Updates authenticated user's widget ordering and card/chart visibility. |
| `GET` | `/api/branches` | All Roles | Lists branches. Scoped users receive only their authorized branch. |
| `GET` | `/api/reporting/datasets` | All Roles | Allowlisted metadata of available queryable datasets, dimensions, and metrics. |
| `POST` | `/api/reports/preview` | Admin, Manager, Analyst, Viewer | Validated aggregation engine. Supports pagination (`page`, `pageSize`), sorting (`sortBy`, `sortOrder`), date ranges, and filters. |
| `GET` | `/api/reports/saved` | All Roles | Lists saved reports accessible to user (all `SHARED` + user's own `PRIVATE`). |
| `POST` | `/api/reports/saved` | Admin, Manager, Analyst | Saves a reusable report configuration. |
| `GET` | `/api/reports/saved/:id` | All Roles | Fetches single saved report details. Access checks enforced. |
| `PATCH` | `/api/reports/saved/:id`| Admin, Manager, Analyst | Updates saved report. Enforces private ownership protection. |
| `DELETE`| `/api/reports/saved/:id`| Admin, Manager, Analyst | Deletes saved report. Enforces private ownership protection. |
| `POST` | `/api/reports/export` | Admin, Manager, Analyst | Generates downloadable CSV with formula injection escaping and writes audit entry to `ReportExportLog`. (Viewer gets 403). |
| `GET` | `/api/reports/export-history`| Admin, Manager, Analyst | Audit history table of all generated report exports with filters and row counts. |
| `GET` | `/api/admin/data-preview` | Administrator | System inspection view for raw branches, staff, tickets, transactions, and users. (All other roles get 403). |

---

## 5. Security & Business Logic Highlights

### 1. CSV Formula Injection Defense
Any exported string starting with formula triggers (`=`, `+`, `-`, `@`) is automatically prefixed with a single quote (`'`), preventing remote code execution or spreadsheet command injection in Microsoft Excel, Google Sheets, or LibreOffice Calc.

### 2. Multi-Tenant Branch Scoping
Users assigned to a specific branch (e.g., `manager.colombo@neirahtech.com`) are strictly bound to their `branchId`. If a branch-scoped user attempts to pass a different `branchId` in query parameters to inspect another branch's performance, the backend immediately rejects the request with **`403 Forbidden`**.

### 3. Private Report Ownership
Reports marked as `PRIVATE` are invisible to other non-admin users. Only the creator (or an Administrator) can view, edit, or delete them.

### 4. Zero-Row & Empty-Range Resiliency
When date filters contain no activity, or when queried against inactive branches, the backend returns clean zero-value KPIs (`0`, `0.00`, empty arrays) without division-by-zero crashes or 500 errors.

### 5. Export Circuit Breaker
Exports are guarded against memory denial-of-service with a strict 10,000-row safety limit.

---

## 6. Frontend Screens Overview

The application features 7 responsive screens accessible from the persistent sidebar:

1. **Login Screen (`/login`)**: Secure authentication with 1-click test credentials for Administrator, Colombo Manager, Global Manager, Analyst, and Viewer.
2. **Overview Dashboard (`/`)**: 6 dynamic KPI metric cards, Date range filter, Branch dropdown filter, Reset filter button, Ticket Status Donut Chart, Monthly Volume Trend Chart, and Branch Revenue Bar Chart.
3. **Report Explorer (`/reports/explorer`)**: Dynamic aggregation query builder with dataset selection (`ServiceTicket`, `Transaction`), dimension selector, metric aggregation (`Count`, `Sum`, `Average`), date range and status filters, interactive preview chart, paginated tabular view, 1-click Save Report modal, and CSV export.
4. **Saved Reports (`/saved-reports`)**: Central library of reusable reports, visibility badges (`SHARED` vs `PRIVATE`), 1-click "Open in Explorer", direct CSV download, inline edit modal, and ownership-protected deletion.
5. **Dashboard Settings (`/settings`)**: Personalized dashboard customization. Toggle visibility and reorder KPI metric cards and Recharts visualizations with persistent backend synchronization.
6. **Data Exports & History (`/exports/history`)**: Comprehensive audit log table showing who exported data, dataset name, applied filter criteria, row counts, and timestamps, plus quick one-click export cards.
7. **Admin Data Preview (`/admin/preview`)**: Restricted system inspection screen with database record counts, data freshness metrics, and tabbed inspection of Branches, Staff, Service Tickets, Transactions, and Users.

---

## 7. Automated Testing & Verification

### Running Backend Unit Tests
```bash
cd backend
npm test
```

### Running Backend E2E & Security Test Suite
The comprehensive end-to-end test suite validates RBAC, branch isolation, negative validation rules, formula injection defense, and report permissions:
```bash
cd backend
npm run test:e2e
```
*Result: 17/17 security and integration tests passing.*

### Running Frontend Production Build Verification
```bash
cd frontend
npm run build
```
*Compiles cleanly with 0 TypeScript or linting errors.*

### API Collection
Import the pre-configured Postman/Bruno collection located at:
- `docs/api-collection.json` (or `docs/postman_collection.json`)
The collection includes pre-configured Bearer tokens for all 5 roles, example requests for all endpoints, and dedicated negative test cases for `400 Bad Request`, `401 Unauthorized`, and `403 Forbidden`.
