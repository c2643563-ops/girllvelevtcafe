# Velvet Cafe & Grill — Complete QR Ordering, POS, KDS, Inventory & Pakistani Payments

**Velvet Cafe & Grill** is a full-stack luxury hospitality platform built with **Next.js 14, Tailwind CSS, Socket.IO, JWT Role-Based Auth, QR Code Generator, Thermal 80mm Receipt Printing, and Supabase PostgreSQL support**.

---

## Step-by-Step Setup & Run Guide (Chalaney ka Mukammal Tareeqa)

### Option 1: Instant One-Click Run (Zero Configuration)
Works out-of-the-box with the built-in persistent database (`data/velvet-db.json`) and Socket.IO real-time server.

1. **Extract the ZIP** into a folder (e.g. `velvet-cafe-grill`).
2. **Install Node.js 18+** (if not already installed).
3. Run:
   - **Windows:** Double-click `start.bat`
   - **Mac / Linux:** Run `chmod +x start.sh && ./start.sh`
   - **Manual Terminal:**
     ```bash
     npm install
     npm run generate-qr
     npm run dev
     ```
4. Open your browser:
   - **Live Website Launcher & Table Selector:** `http://localhost:3000`
   - **Customer QR Menu (Table 1 to 15):** `http://localhost:3000/menu?table=1` ... `?table=15`
   - **Staff Login Portal:** `http://localhost:3000/staff/login`

---

## Staff Accounts & Role-Based Security (JWT + bcrypt)

| Role | Email | Password | Workspace |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `owner@velvetcafe.pk` | `Velvet@2026` | All Dashboards + `/staff/owner` |
| **Cashier** | `cashier@velvetcafe.pk` | `Cashier@2026` | `/staff/cashier` + `/staff/qr-codes` + Inventory |
| **Kitchen Chef** | `kitchen@velvetcafe.pk` | `Kitchen@2026` | `/staff/kitchen` + Inventory |

---

## 15-Table Working QR Codes (Phone Scan Ready)

- Pre-generated PNG files are saved in `public/qr-codes/table-1.png` ... `table-15.png`.
- **Important for Phone Scanning:**
  - When deployed to your live domain (or local Wi-Fi IP like `http://192.168.1.25:3000`), open `/staff/qr-codes` in the browser — it **automatically detects your live URL** and lets you click **"Regenerate & Save All 15 PNGs"** or **"Print All 15 Cards"**.
  - Or run via CLI:
    ```bash
    node scripts/generate-qr.js https://your-live-domain.com
    ```

---

## Connecting Supabase (Live PostgreSQL Cloud Sync)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in Supabase and run the entire `supabase_schema.sql` file included in this project.
3. Copy `.env.example` to `.env.local` and fill:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Restart the server — all orders, 15 tables, payments, and inventory updates will sync live to Supabase!

---

## Pakistani Payment Gateways (Easypaisa, JazzCash, Bank/Raast & Cash)

- Customer opens `/order/[id]` after ordering and sees **Velvet Pay**:
  - **Easypaisa** (Mobile Account + MPIN/OTP)
  - **JazzCash** (Mobile Account + MPIN)
  - **Bank Transfer / Raast** (IBAN copy + Transaction TID)
  - **Cash on Counter** (Instant Cashier notification + 1-click verify)
- When payment completes, the **Cashier POS (`/staff/cashier`)** flashes a live audio/visual alert and marks that table with an **Emerald Green Tick (`PAID ✓`)**.
- To switch from Sandbox Mode to Live Merchant APIs, fill `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`, and `RAAST_IBAN` in `.env.local`.

---

## Pre-Loaded Inventory (Auto-Deducted on Orders)
All 7 items start at **100 pieces** with automatic **25 pieces** low-stock warning:
- Burger boxes (`100 pieces`, alert `25 pieces`)
- Fries cups/boxes (`100 pieces`, alert `25 pieces`)
- Cold drink cups (`100 pieces`, alert `25 pieces`)
- Cup lids (`100 pieces`, alert `25 pieces`)
- Straws (`100 pieces`, alert `25 pieces`)
- Takeaway bags (`100 pieces`, alert `25 pieces`)
- Tissues (`100 pieces`, alert `25 pieces`)
