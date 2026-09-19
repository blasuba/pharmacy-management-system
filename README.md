# 🏥 Pharmacy Management System (PMS)

Enterprise Pharmacy Management & Wholesale Distribution System built with **Spring Boot 3.3.x (Java 17)** and **Angular 18**.

---

## 🚀 Key Modules
- **FEFO Batch Inventory Ledger**: First-Expiry-First-Out auto-deduction with immutable transaction logs.
- **High-Speed Point of Sale (POS)**: Barcode-driven terminal, multi-tier pricing (Retail / Wholesale / Distributor), and JPA optimistic locking.
- **Procurement & Goods Received Note (GRN)**: Purchase orders from suppliers with automatic batch creation.
- **Dual Printing Engine**: 58mm/80mm Thermal POS Receipts & A4 Wholesale Invoices.
- **Automated Alerts & WebSockets**: Expiry warning crons (30/60/90 days) and live stock-out alerts.
- **Profit & Loss Analytics**: Real-time margin calculation, stock valuation, and Excel/PDF reports.
- **Dynamic RBAC**: Configurable roles & permissions (Owner, Pharmacist, Cashier/Accounting, etc.).

---

## 🛠️ Tech Stack
- **Backend**: Spring Boot 3.3, Java 17, Spring Security 6, JWT, Spring Data JPA, OpenPDF, WebSocket (STOMP), OpenAPI 3 (Swagger).
- **Frontend**: Angular 18 (Standalone Components, Signals), Tailwind CSS, Lucide Icons, Chart.js.
- **Database**: PostgreSQL / MySQL / H2.

---

## 🏃 Getting Started

### 1. Backend (`pms-backend`)
```bash
cd /home/esubalew/Documents/Persona/Pharmacy/pms-backend
mvn clean spring-boot:run
```
- **API Base URL**: `http://localhost:8080/api/v1`
- **Swagger Documentation**: `http://localhost:8080/api/v1/swagger-ui.html`

### 2. Frontend (`pms-frontend`)
```bash
cd /home/esubalew/Documents/Persona/Pharmacy/pms-frontend
npm install
npm start
```
- **Web App**: `http://localhost:4200`

---

## 🔐 Default Credentials
| Role | Username | Password |
|---|---|---|
| **Owner / Super Admin** | `admin` | `Admin@123` |
| **Pharmacist** | `pharmacist` | `Pharm@123` |
| **Cashier / Accounting** | `cashier` | `Cash@123` |

---

*For the complete architectural design and database dictionary, see [ARCHITECTURE_AND_SPECIFICATION.md](./ARCHITECTURE_AND_SPECIFICATION.md).*
