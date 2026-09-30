# 🏥 Pharmacy Management System (PMS)

Enterprise Pharmacy Management & Wholesale Distribution System built with **Spring Boot 3.3.x (Java 17)** and **Angular 18**.

---

## 🚀 Key Modules
- **FEFO Batch Inventory Ledger**: First-Expiry-First-Out auto-deduction with immutable transaction logs.
- **High-Speed Point of Sale (POS)**: Barcode-driven terminal, multi-tier pricing (Retail / Wholesale / Distributor), and JPA optimistic locking.
- **Procurement & Goods Received Note (GRN)**: Purchase orders from suppliers with automatic batch creation.
- **Fixed Asset & Equipment Management**: Registry, straight-line/reducing balance depreciation schedules, and maintenance tracking.
- **Cash Drawer & Shift Management**: Real-time cashier reconciliation, cash IN/OUT auditing, and shift closing.
- **Dual Printing Engine**: 58mm/80mm Thermal POS Receipts & A4 Wholesale Invoices.
- **Automated Alerts & WebSockets**: Expiry warning crons (30/60/90 days) and live stock-out alerts.
- **Profit & Loss Analytics**: Real-time margin calculation, stock valuation, and Excel/PDF reports.
- **Dynamic RBAC**: Configurable roles & permissions (Owner, Pharmacist, Cashier/Accounting, etc.).

---

## 🛠️ Tech Stack
- **Backend**: Spring Boot 3.3, Java 17, Spring Security 6, JWT, Spring Data JPA, OpenPDF, WebSocket (STOMP), OpenAPI 3 (Swagger).
- **Frontend**: Angular 18 (Standalone Components, Signals), Lucide Icons, Chart.js.
- **Database**: PostgreSQL.
- **Containerization**: Docker & Docker Compose.

---

## 🏃 Getting Started

### Option A: Docker Compose (Full Stack)
```bash
docker compose up -d
```
- **Web App**: `http://localhost:4200`
- **Backend API**: `http://localhost:8081/api/v1`
- **Swagger Documentation**: `http://localhost:8081/api/v1/swagger-ui.html`

---

### Option B: Local Development

#### 1. Database
```bash
docker compose up -d postgres
```

#### 2. Backend (`pms-backend`)
```bash
cd pms-backend
mvn spring-boot:run
```
- **API Base URL**: `http://localhost:8081/api/v1`
- **Swagger Documentation**: `http://localhost:8081/api/v1/swagger-ui.html`

#### 3. Frontend (`pms-frontend`)
```bash
cd pms-frontend
npm install
npm start
```
- **Web App**: `http://localhost:4200`

---

## 🔐 Authentication & Initial Seed Users

Default roles are provisioned on initial startup with configurable credentials. For production environments, define custom secure passwords via environment variables:

| Role | Username | Environment Variable |
|---|---|---|
| **Owner / Super Admin** | `admin` | `ADMIN_INITIAL_PASSWORD` |
| **Pharmacist** | `pharmacist` | `PHARMACIST_INITIAL_PASSWORD` |
| **Cashier / Accounting** | `cashier` | `CASHIER_INITIAL_PASSWORD` |

> [!NOTE]
> All users should update their default passwords immediately upon initial login via the User Profile / Security settings.

---

*For the complete architectural design and database dictionary, see [ARCHITECTURE_AND_SPECIFICATION.md](./ARCHITECTURE_AND_SPECIFICATION.md).*
