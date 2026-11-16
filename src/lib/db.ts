import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from './supabase';
import type {
  CafeTable,
  ExpenseRecord,
  InventoryItem,
  MenuItem,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  StaffUser,
  VelvetDatabase,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'velvet-db.json');

declare global {
  // eslint-disable-next-line no-var
  var __velvetDBCache: VelvetDatabase | undefined;
}

function createSeedDatabase(): VelvetDatabase {
  const now = new Date().toISOString();

  const staffUsers: StaffUser[] = [
    {
      id: 'staff-owner-1',
      name: 'Aayan Malik (Owner)',
      email: 'owner@velvetcafe.pk',
      passwordHash: bcrypt.hashSync('Velvet@2026', 10),
      role: 'OWNER',
      active: true,
      createdAt: now,
    },
    {
      id: 'staff-cashier-1',
      name: 'Zainab Tariq (Cashier)',
      email: 'cashier@velvetcafe.pk',
      passwordHash: bcrypt.hashSync('Cashier@2026', 10),
      role: 'CASHIER',
      active: true,
      createdAt: now,
    },
    {
      id: 'staff-kitchen-1',
      name: 'Chef Hamza (Head Grill)',
      email: 'kitchen@velvetcafe.pk',
      passwordHash: bcrypt.hashSync('Kitchen@2026', 10),
      role: 'KITCHEN',
      active: true,
      createdAt: now,
    },
  ];

  const tables: CafeTable[] = Array.from({ length: 15 }, (_, idx) => {
    const num = idx + 1;
    return {
      tableNumber: num,
      label: `Table ${num}`,
      capacity: num <= 5 ? 2 : num <= 12 ? 4 : 6,
      status: 'AVAILABLE',
      activeOrderId: null,
      lastPaymentMethod: null,
      lastPaidAt: null,
      updatedAt: now,
    };
  });

  const menuItems: MenuItem[] = [
    // Signature Grill
    {
      id: 'menu-1',
      name: 'Velvet Signature Charcoal Steak',
      category: 'Signature Grill',
      description: 'Prime beef tenderloin flame-seared over charcoal, rosemary butter, garlic mash & roasted baby carrots.',
      price: 2450,
      tag: "Chef's Crown",
      prepMinutes: 22,
      isAvailable: true,
      packagingType: 'none',
    },
    {
      id: 'menu-2',
      name: 'Peri-Peri Flame Half Chicken',
      category: 'Signature Grill',
      description: '24-hour marinated spring chicken grilled with smoky peri-peri glaze, herb rice & garlic dip.',
      price: 1650,
      tag: 'Best Seller',
      prepMinutes: 20,
      isAvailable: true,
      packagingType: 'none',
    },
    {
      id: 'menu-3',
      name: 'Moroccan Tarragon Chicken',
      category: 'Signature Grill',
      description: 'Char-grilled chicken breast glazed in creamy French tarragon mushroom velouté with sautéed greens.',
      price: 1750,
      tag: 'Popular',
      prepMinutes: 18,
      isAvailable: true,
      packagingType: 'none',
    },
    // Artisan Burgers
    {
      id: 'menu-4',
      name: 'The Velvet Double Smash Burger',
      category: 'Artisan Burgers',
      description: 'Double seared beef patties, aged cheddar, caramelized shallots, truffle aioli in toasted brioche.',
      price: 1250,
      tag: 'Best Seller',
      prepMinutes: 14,
      isAvailable: true,
      packagingType: 'burger',
    },
    {
      id: 'menu-5',
      name: 'Burgundy Smoke Crispy Chicken Burger',
      category: 'Artisan Burgers',
      description: 'Golden buttermilk crispy fillet, smoky chipotle slaw, melted Monterey Jack & pickled jalapeños.',
      price: 1050,
      tag: 'Crispy Hit',
      prepMinutes: 14,
      isAvailable: true,
      packagingType: 'burger',
    },
    {
      id: 'menu-6',
      name: 'Truffle Swiss Mushroom Melt',
      category: 'Artisan Burgers',
      description: 'Juicy Wagyu-blend patty topped with sautéed wild mushrooms, Swiss Emmental & garlic herb butter.',
      price: 1390,
      tag: 'Gourmet',
      prepMinutes: 15,
      isAvailable: true,
      packagingType: 'burger',
    },
    // Pasta & Mains
    {
      id: 'menu-7',
      name: 'Fettuccine Alfredo Florentine',
      category: 'Pasta & Mains',
      description: 'Silky parmesan cream sauce tossed with artisan fettuccine, char-grilled chicken & cracked black pepper.',
      price: 1450,
      tag: 'Guest Favorite',
      prepMinutes: 16,
      isAvailable: true,
      packagingType: 'none',
    },
    {
      id: 'menu-8',
      name: 'Spicy Arrabbiata Penne & Prawn',
      category: 'Pasta & Mains',
      description: 'San Marzano chili-garlic tomato reduction with jumbo pan-seared prawns and fresh basil.',
      price: 1690,
      tag: 'Spicy',
      prepMinutes: 17,
      isAvailable: true,
      packagingType: 'none',
    },
    // Crispy Sides & Starters
    {
      id: 'menu-9',
      name: 'Truffle Parmesan Loaded Fries',
      category: 'Crispy Sides',
      description: 'Hand-cut crispy skin-on fries tossed in white truffle oil, aged parmesan & garlic herb aioli.',
      price: 690,
      tag: 'Shareable',
      prepMinutes: 10,
      isAvailable: true,
      packagingType: 'fries',
    },
    {
      id: 'menu-10',
      name: 'Dynamite Crispy Prawns',
      category: 'Crispy Sides',
      description: 'Tempura tiger prawns drizzled in signature Velvet sweet-chili sriracha glaze over crisp greens.',
      price: 1190,
      tag: 'Must Try',
      prepMinutes: 12,
      isAvailable: true,
      packagingType: 'fries',
    },
    {
      id: 'menu-11',
      name: 'Golden Masala Fries Cup',
      category: 'Crispy Sides',
      description: 'Crisp golden shoestring fries dusted in house spice blend with smoky velvet dip.',
      price: 490,
      prepMinutes: 8,
      isAvailable: true,
      packagingType: 'fries',
    },
    // Cold Drinks & Shakes
    {
      id: 'menu-12',
      name: 'Belgian Lotus Biscoff Shake',
      category: 'Cold Drinks & Shakes',
      description: 'Velvety vanilla bean gelato spun with caramelized Biscoff spread, whipped cream & biscuit crumble.',
      price: 790,
      tag: 'Signature',
      prepMinutes: 6,
      isAvailable: true,
      packagingType: 'drink',
    },
    {
      id: 'menu-13',
      name: 'Burgundy Berry Mint Mojito',
      category: 'Cold Drinks & Shakes',
      description: 'Crushed blackberries, fresh garden mint, lime zest & sparkling chilled soda.',
      price: 550,
      tag: 'Refreshing',
      prepMinutes: 5,
      isAvailable: true,
      packagingType: 'drink',
    },
    {
      id: 'menu-14',
      name: 'Iced Caramel Macchiato',
      category: 'Cold Drinks & Shakes',
      description: 'Double-shot artisan espresso poured over chilled milk, ice & buttery salted caramel.',
      price: 650,
      prepMinutes: 5,
      isAvailable: true,
      packagingType: 'drink',
    },
    {
      id: 'menu-15',
      name: 'Chilled Mint Margarita',
      category: 'Cold Drinks & Shakes',
      description: 'Classic Pakistani cafe favorite — freshly blended mint, lemon juice, black salt & crushed ice.',
      price: 450,
      prepMinutes: 5,
      isAvailable: true,
      packagingType: 'drink',
    },
    // Artisan Desserts & Hot Bar
    {
      id: 'menu-16',
      name: 'Molten Velvet Chocolate Lava Cake',
      category: 'Desserts & Hot Bar',
      description: 'Warm Belgian dark chocolate fondant with a molten center & Madagascar vanilla gelato.',
      price: 890,
      tag: 'Sweet Finale',
      prepMinutes: 12,
      isAvailable: true,
      packagingType: 'none',
    },
    {
      id: 'menu-17',
      name: 'San Sebastian Burnt Cheesecake',
      category: 'Desserts & Hot Bar',
      description: 'Creamy caramelized Basque cheesecake served with warm dark chocolate ganache pour.',
      price: 950,
      tag: 'Trending',
      prepMinutes: 6,
      isAvailable: true,
      packagingType: 'none',
    },
    {
      id: 'menu-18',
      name: 'Peshawari Saffron Kashmiri Chai',
      category: 'Desserts & Hot Bar',
      description: 'Slow-brewed pink velvet tea infused with cardamom, Kashmiri saffron & crushed pistachios.',
      price: 420,
      tag: 'House Special',
      prepMinutes: 8,
      isAvailable: true,
      packagingType: 'drink',
    },
  ];

  // Exact demo inventory requested by the user
  const inventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Burger boxes', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
    { id: 'inv-2', name: 'Fries cups/boxes', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
    { id: 'inv-3', name: 'Cold drink cups', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
    { id: 'inv-4', name: 'Cup lids', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
    { id: 'inv-5', name: 'Straws', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
    { id: 'inv-6', name: 'Takeaway bags', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
    { id: 'inv-7', name: 'Tissues', category: 'Packaging', quantity: 100, unit: 'pieces', minThreshold: 25, updatedAt: now },
  ];

  const expenses: ExpenseRecord[] = [
    {
      id: 'exp-1',
      title: 'Fresh Charcoal & Grill Fuel',
      category: 'Kitchen Supplies',
      amount: 4500,
      notes: 'Daily BBQ charcoal restock',
      recordedBy: 'Aayan Malik (Owner)',
      createdAt: now,
    },
    {
      id: 'exp-2',
      title: 'Fresh Dairy & Artisan Brioche Buns',
      category: 'Ingredients',
      amount: 8200,
      notes: 'Morning bakery & dairy delivery',
      recordedBy: 'Aayan Malik (Owner)',
      createdAt: now,
    },
  ];

  return {
    staffUsers,
    tables,
    menuItems,
    orders: [],
    payments: [],
    inventory,
    expenses,
  };
}

export function readDB(): VelvetDatabase {
  if (global.__velvetDBCache) {
    return global.__velvetDBCache;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    global.__velvetDBCache = seed;
    return seed;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as VelvetDatabase;
    global.__velvetDBCache = parsed;
    return parsed;
  } catch {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    global.__velvetDBCache = seed;
    return seed;
  }
}

export function writeDB(db: VelvetDatabase): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  global.__velvetDBCache = db;
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

// ============================================================================
// OPTIONAL LIVE SUPABASE SYNC (runs seamlessly alongside local DB if configured)
// ============================================================================
export async function syncOrderToSupabase(order: Order, table: CafeTable) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    await sb.from('cafe_tables').upsert({
      table_number: table.tableNumber,
      label: table.label,
      capacity: table.capacity,
      status: table.status,
      active_order_id: table.activeOrderId,
      last_payment_method: table.lastPaymentMethod,
      updated_at: table.updatedAt,
    });

    await sb.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      table_number: order.tableNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone || null,
      order_type: order.orderType,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      payment_reference: order.paymentReference,
      notes: order.notes || null,
      paid_at: order.paidAt,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    });

    if (order.items.length > 0) {
      await sb.from('order_items').upsert(
        order.items.map((item) => ({
          id: item.id,
          order_id: order.id,
          menu_item_id: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || null,
        }))
      );
    }
  } catch (err) {
    console.error('[Supabase Sync] Order sync error:', err);
  }
}

export async function syncPaymentToSupabase(payment: PaymentRecord, order: Order, table: CafeTable) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    await sb.from('payments').upsert({
      id: payment.id,
      order_id: payment.orderId,
      table_number: payment.tableNumber,
      method: payment.method,
      amount: payment.amount,
      reference_id: payment.referenceId,
      account_or_phone: payment.accountOrPhone || null,
      status: payment.status,
      gateway_mode: payment.gatewayMode,
      created_at: payment.createdAt,
    });
    await syncOrderToSupabase(order, table);
  } catch (err) {
    console.error('[Supabase Sync] Payment sync error:', err);
  }
}

export async function syncInventoryToSupabase(items: InventoryItem[]) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    await sb.from('inventory_items').upsert(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        min_threshold: i.minThreshold,
        updated_at: i.updatedAt,
      }))
    );
  } catch (err) {
    console.error('[Supabase Sync] Inventory sync error:', err);
  }
}

// ============================================================================
// HIGH-LEVEL DOMAIN HELPERS
// ============================================================================

export function generateOrderNumber(db: VelvetDatabase): string {
  const count = db.orders.length + 101;
  return `VCG-${count}`;
}

export function deductPackagingInventory(
  db: VelvetDatabase,
  order: Order
): InventoryItem[] {
  const now = new Date().toISOString();
  const touched: InventoryItem[] = [];

  const adjust = (name: string, amount: number) => {
    const item = db.inventory.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (item && amount > 0) {
      item.quantity = Math.max(0, item.quantity - amount);
      item.updatedAt = now;
      touched.push(item);
    }
  };

  let totalItems = 0;
  for (const item of order.items) {
    totalItems += item.quantity;
    if (item.packagingType === 'burger') {
      adjust('Burger boxes', item.quantity);
      adjust('Tissues', item.quantity);
    } else if (item.packagingType === 'fries') {
      adjust('Fries cups/boxes', item.quantity);
      adjust('Tissues', item.quantity);
    } else if (item.packagingType === 'drink') {
      adjust('Cold drink cups', item.quantity);
      adjust('Cup lids', item.quantity);
      adjust('Straws', item.quantity);
    } else {
      adjust('Tissues', item.quantity);
    }
  }

  if (order.orderType === 'TAKEAWAY' && totalItems > 0) {
    adjust('Takeaway bags', 1);
  }

  return touched;
}

export function updateOrderStatusInDB(
  orderId: string,
  status: OrderStatus
): { order: Order; table: CafeTable | undefined } | null {
  const db = readDB();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  order.status = status;
  order.updatedAt = now;

  const table = db.tables.find((t) => t.tableNumber === order.tableNumber);
  if (table) {
    if (status === 'CANCELLED') {
      table.status = 'AVAILABLE';
      table.activeOrderId = null;
    } else if (status === 'COMPLETED' && order.paymentStatus === 'PAID') {
      table.status = 'PAID';
    } else if (status === 'READY' || status === 'COMPLETED') {
      table.status = order.paymentStatus === 'PAID' ? 'PAID' : 'BILL_PENDING';
    }
    table.updatedAt = now;
  }

  writeDB(db);
  return { order, table };
}

export function completeOrderPaymentInDB(params: {
  orderId: string;
  method: PaymentMethod;
  referenceId: string;
  accountOrPhone?: string;
  paymentStatus?: PaymentStatus;
}): { order: Order; table: CafeTable | undefined; payment: PaymentRecord } | null {
  const db = readDB();
  const order = db.orders.find((o) => o.id === params.orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  const finalPayStatus: PaymentStatus = params.paymentStatus || 'PAID';

  order.paymentStatus = finalPayStatus;
  order.paymentMethod = params.method;
  order.paymentReference = params.referenceId;
  if (finalPayStatus === 'PAID') {
    order.paidAt = now;
  }
  order.updatedAt = now;

  const payment: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    method: params.method,
    amount: order.total,
    referenceId: params.referenceId,
    accountOrPhone: params.accountOrPhone,
    status: finalPayStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
    gatewayMode:
      process.env.EASYPAISA_STORE_ID || process.env.JAZZCASH_MERCHANT_ID
        ? 'PRODUCTION'
        : 'SANDBOX',
    createdAt: now,
  };
  db.payments.unshift(payment);

  const table = db.tables.find((t) => t.tableNumber === order.tableNumber);
  if (table) {
    table.activeOrderId = order.id;
    table.lastPaymentMethod = params.method;
    if (finalPayStatus === 'PAID') {
      table.status = 'PAID';
      table.lastPaidAt = now;
    } else {
      table.status = 'BILL_PENDING';
    }
    table.updatedAt = now;
  }

  writeDB(db);
  return { order, table, payment };
}

export function resetTableInDB(tableNumber: number): CafeTable | null {
  const db = readDB();
  const table = db.tables.find((t) => t.tableNumber === tableNumber);
  if (!table) return null;

  table.status = 'AVAILABLE';
  table.activeOrderId = null;
  table.updatedAt = new Date().toISOString();
  writeDB(db);
  return table;
}
