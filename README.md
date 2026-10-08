# TerraCraft Artisanal Ceramics

**Course:** E-Commerce  
**Department:** Department of Computer Science / Artificial Intelligence  
**Institution:** Institute of Mathematics & Computer Science, University of Sindh, Jamshoro  
**Student Name:** Kalpna Asnani  
**Roll No:** 2k23/CSM/55  
**Sprint Implementation:** Sprint 1 & Sprint 2  

TerraCraft is a domain-specialized ceramic stoneware e-commerce catalog and data foundation. The platform enforces strict variant-combination integrity (CAT-04), non-negative inventory constraints (CAT-05), and hierarchical taxonomy with automated graph cycle prevention (CAT-01).

---

## 1. System Requirements

- **Operating System:** Windows 10/11, macOS, or Linux.
- **Node.js:** v20.x or higher (Tested and verified on **Node.js v24.18.0**).
- **npm:** v10.x or higher (Tested on **npm v11.16.0**).
- **PostgreSQL (Optional for Live Mode):** PostgreSQL 14, 15, or 16.
- **Offline / USB Portability Mode:** Can run 100% offline with zero external services using the built-in PostgreSQL engine simulation (`pg-mem`).

---

## 2. Fast-Start Guide (Running from USB Drive)

### Step 1: Copy Project
Copy the `E-commerce` folder directly to your desired location (e.g. `C:\Projects\E-commerce` or your Desktop).

### Step 2: Open Terminal & Install Dependencies
Open PowerShell or Command Prompt inside the project directory:

```bash
cd E-commerce
npm install
```
*(On Windows PowerShell where script execution policy is restricted, use `npm.cmd install`)*

### Step 3: Configure Environment
Copy the sample environment file to create your local `.env`:

```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Command Prompt:
copy .env.example .env
```

The default `.env` is pre-configured with `USE_IN_MEMORY_DB=true`, enabling instant execution on any laptop without needing to install or start a PostgreSQL server!

---

## 3. Database Modes (PostgreSQL vs. Zero-Setup Local Mode)

TerraCraft features a dual-engine architecture:

### Mode A: Zero-Setup In-Memory Mode (Default for Quick USB Grading)
- Set in `.env`: `USE_IN_MEMORY_DB=true`.
- Zero database server required.
- Perfect for offline grading, USB demonstrations, and running tests.

### Mode B: Real PostgreSQL Server
- If you have a local PostgreSQL instance installed:
  1. Create a database:
     ```sql
     CREATE DATABASE terracraft_db;
     ```
  2. Update your `.env`:
     ```env
     USE_IN_MEMORY_DB=false
     PGHOST=localhost
     PGPORT=5432
     PGUSER=postgres
     PGPASSWORD=your_postgres_password
     PGDATABASE=terracraft_db
     ```
  3. Run the migrations:
     ```bash
     npm run migrate
     ```
  4. Seed the initial catalog data:
     ```bash
     npm run seed
     ```

---

## 4. Running the Application

Start the local server:

```bash
npm start
```
*(Or `npm run dev`)*

The server will initialize on port **5000**:
- **Interactive Web Demonstration UI:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

Open [http://localhost:5000](http://localhost:5000) in any web browser to view the category hierarchy, product catalog, variant combination matrix, and test live API endpoints!

---

## 5. Automated Testing & Verification

Run the comprehensive test suite covering all Sprint 2 functional requirements:

```bash
npm test
```

### What `npm test` Validates:
- **`tests/auth.test.js`**: JWT signature verification, expired token rejection, role-based authorization (403 for customers on admin endpoints).
- **`tests/category.test.js`**: CAT-01 Category tree building, slug uniqueness, and self-parent / descendant cycle prevention.
- **`tests/product.test.js`**: CAT-02 Product drafts, metadata validation, and publication restrictions.
- **`tests/sku.test.js`**: CAT-03 & CAT-04 Sellable SKUs, variant dimension validation, and non-negative stock.
- **`tests/dataIntegrity.test.js`**: CAT-05 Database CHECK constraints, UNIQUE constraints, and foreign key cascade/restrict behaviors.

### Database Audit Script
Run the standalone constraint verification script:

```bash
npm run validate:db
```

---

## 6. Local Demo Credentials

The seed script creates the following local demonstration accounts:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Studio Administrator** | `admin@terracraft.local` | `StudioAdmin2026!` | Full administrative CRUD (`/api/v1/admin/*`) |
| **Retail Customer** | `buyer@terracraft.local` | `CustomerPass2026!` | Public browsing & profile (`/api/v1/auth/me`) |

*(Note: These are offline demo credentials only. Never use real personal passwords.)*

---

## 7. Project Structure

```text
E-commerce/
├── docs/
│   ├── PROJECT_DECISION.md       # Chosen project rationale, student details, domain architecture
│   ├── SPRINT_1.md               # Sprint 1 system architecture, scope matrix, tech stack, ERD
│   └── SPRINT_2.md               # Sprint 2 data foundation, route table, business rule answers
├── migrations/
│   ├── 001_create_users.sql      # User accounts & RBAC
│   ├── 002_create_categories.sql # Category tree with recursive parent_id
│   ├── 003_create_products_and_variants.sql # Products, statuses, variants
│   ├── 004_create_skus_and_assets.sql       # Materialized SKUs and media assets
│   └── 005_create_orders_and_carts.sql      # Carts and orders transactional foundation
├── public/
│   ├── index.html                # Interactive browser dashboard for evaluation
│   ├── style.css                 # Artisanal stoneware aesthetic styling
│   └── app.js                    # Live API tester and client-side view logic
├── src/
│   ├── config/
│   │   ├── database.js           # Dual PostgreSQL and in-memory engine pool manager
│   │   └── env.js                # Centralized environment variable loader
│   ├── controllers/
│   │   ├── authController.js     # User authentication and JWT issuance
│   │   ├── categoryController.js # Category tree and cycle checking
│   │   ├── productController.js  # Product drafting and publication rules
│   │   └── skuController.js      # Variant combinations and inventory updates
│   ├── middleware/
│   │   ├── auth.js               # JWT verification and requireAdmin guard
│   │   └── errorHandler.js       # Unified JSON error handler (no server traces)
│   ├── models/
│   │   ├── categoryModel.js      # Category SQL queries
│   │   ├── productModel.js       # Product SQL queries
│   │   ├── skuModel.js           # SKU SQL queries
│   │   └── userModel.js          # User SQL queries
│   ├── routes/
│   │   ├── adminRoutes.js        # Sprint 2 administration contract routes
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── publicRoutes.js       # Storefront read-only routes
│   │   └── index.js              # Router aggregator & /health
│   ├── scripts/
│   │   ├── migrate.js            # SQL migration runner
│   │   ├── seed.js               # Multi-level category & variant seed data
│   │   └── validateDb.js         # Database schema & constraint audit script
│   ├── utils/
│   │   ├── categoryTree.js       # Tree builder and ancestor cycle detection
│   │   └── variantValidator.js   # Permitted combination checker and price/stock validator
│   ├── app.js                    # Express app instance
│   └── server.js                 # HTTP listener & lifecycle manager
├── tests/
│   ├── auth.test.js              # 12 authentication & RBAC tests
│   ├── category.test.js          # 11 category hierarchy & cycle tests
│   ├── dataIntegrity.test.js     # 7 database engine constraint tests
│   ├── product.test.js           # 11 product lifecycle tests
│   ├── sku.test.js               # 12 variant combination & stock tests
│   └── testHelper.js             # Test database setup & token generator
├── .env.example                  # Environment template
├── .gitignore                    # Local ignore rules
├── package.json                  # Dependencies & scripts
└── README.md                     # Local setup & operation instructions
```

---

## 8. Key Business Rules Implemented

1. **CAT-01 Category Cycle Prevention:** A category cannot be set to be its own parent, nor can it accept any of its own descendants as its parent.
2. **CAT-02 Product Lifecycle:** Products begin in `'draft'` status. Transitioning to `'published'` requires at least one active, sellable SKU.
3. **CAT-03 & CAT-04 Variant Combinations:** Only valid, physically manufacturable combinations are stored in the database. Unavailable combinations (e.g. *Small &times; Sage Gloss*) are **never** represented as fake or zero-stock records.
4. **CAT-05 Constraint Protection:** Stock cannot become negative (`CHECK (stock_quantity >= 0)`), prices must be non-negative decimals (`CHECK (price >= 0)`), and SKU codes are catalog-unique.
5. **CAT-06 Server-Enforced RBAC:** Administrative routes reject unauthenticated requests (401) and non-admin tokens (403). Client-supplied request body roles are never trusted.
