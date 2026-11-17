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

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'velvet-cafe-grill-data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'velvet-db.json');

declare global {
  // eslint-disable-next-line no-var
  var __velvetDBCache: VelvetDatabase | undefined;
  // eslint-disable-next-line no-var
  var __velvetHydrated: boolean | undefined;
  // eslint-disable-next-line no-var
  var __velvetHydratePromise: Promise<VelvetDatabase> | undefined;
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
      imageUrl: '/menu/menu-1.jpg',
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
      imageUrl: '/menu/menu-2.jpg',
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
      imageUrl: '/menu/menu-3.jpg',
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
      imageUrl: '/menu/menu-4.jpg',
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
      imageUrl: '/menu/menu-5.jpg',
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
      imageUrl: '/menu/menu-6.jpg',
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
      imageUrl: '/menu/menu-7.jpg',
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
      imageUrl: '/menu/menu-8.jpg',
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
      imageUrl: '/menu/menu-9.jpg',
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
      imageUrl: '/menu/menu-10.jpg',
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
      imageUrl: '/menu/menu-11.jpg',
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
      imageUrl: '/menu/menu-12.jpg',
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
      imageUrl: '/menu/menu-13.jpg',
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
      imageUrl: '/menu/menu-14.jpg',
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
      imageUrl: '/menu/menu-15.jpg',
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
      imageUrl: '/menu/menu-16.jpg',
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
      imageUrl: '/menu/menu-17.jpg',
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
      imageUrl: '/menu/menu-18.jpg',
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
    // Ensure menu items always have their imageUrl even on existing DB files
    if (Array.isArray(parsed.menuItems)) {
      let changed = false;
      for (const item of parsed.menuItems) {
        if (!item.imageUrl && item.id.startsWith('menu-')) {
          item.imageUrl = `/menu/${item.id}.jpg`;
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');
      }
    }
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
// OPTIONAL LIVE SUPABASE SYNC & HYDRATION (persistent across Railway deploys)
// ============================================================================
export async function ensureSupabaseHydrated(): Promise<VelvetDatabase> {
  const db = readDB();
  const sb = getSupabaseAdmin();
  if (!sb || global.__velvetHydrated) {
    return db;
  }

  if (!global.__velvetHydratePromise) {
    global.__velvetHydratePromise = (async () => {
      try {
        const [tablesRes, ordersRes, itemsRes, paymentsRes, invRes, expRes] = await Promise.all([
          sb.from('cafe_tables').select('*').order('table_number', { ascending: true }),
          sb.from('orders').select('*').order('created_at', { ascending: false }),
          sb.from('order_items').select('*'),
          sb.from('payments').select('*').order('created_at', { ascending: false }),
          sb.from('inventory_items').select('*'),
          sb.from('expenses').select('*').order('created_at', { ascending: false }),
        ]);

        if (tablesRes.error) console.error('[Supabase Hydrate] cafe_tables error:', tablesRes.error);
        if (ordersRes.error) console.error('[Supabase Hydrate] orders error:', ordersRes.error);
        if (itemsRes.error) console.error('[Supabase Hydrate] order_items error:', itemsRes.error);
        if (paymentsRes.error) console.error('[Supabase Hydrate] payments error:', paymentsRes.error);
        if (invRes.error) console.error('[Supabase Hydrate] inventory_items error:', invRes.error);
        if (expRes.error) console.error('[Supabase Hydrate] expenses error:', expRes.error);

        const current = readDB();

        if (tablesRes.data && tablesRes.data.length > 0) {
          const tableMap = new Map<number, CafeTable>();
          for (const t of current.tables) tableMap.set(t.tableNumber, t);
          const tablesToNormalize: CafeTable[] = [];
          for (const row of tablesRes.data) {
            const tNum = Number(row.table_number);
            const existing = tableMap.get(tNum);
            const rawStatus = (row.status as CafeTable['status']) || 'AVAILABLE';
            // Paid tables automatically return to AVAILABLE (blank) so new orders show clearly
            const normalizedStatus: CafeTable['status'] =
              rawStatus === 'PAID' ? 'AVAILABLE' : rawStatus;
            const tableObj: CafeTable = {
              tableNumber: tNum,
              label: row.label || `Table ${tNum}`,
              capacity: Number(row.capacity || existing?.capacity || 4),
              status: normalizedStatus,
              activeOrderId: rawStatus === 'PAID' ? null : row.active_order_id || null,
              lastPaymentMethod: (row.last_payment_method as PaymentMethod | null) || null,
              lastPaidAt: existing?.lastPaidAt || null,
              updatedAt: row.updated_at || new Date().toISOString(),
            };
            tableMap.set(tNum, tableObj);
            if (rawStatus === 'PAID') {
              tablesToNormalize.push(tableObj);
            }
          }
          current.tables = Array.from(tableMap.values()).sort((a, b) => a.tableNumber - b.tableNumber);
          if (tablesToNormalize.length > 0) {
            await sb.from('cafe_tables').upsert(
              tablesToNormalize.map((t) => ({
                table_number: t.tableNumber,
                label: t.label,
                capacity: t.capacity,
                status: t.status,
                active_order_id: t.activeOrderId,
                last_payment_method: t.lastPaymentMethod,
                updated_at: t.updatedAt,
              }))
            );
          }
        } else if (!tablesRes.error) {
          await sb.from('cafe_tables').upsert(
            current.tables.map((t) => ({
              table_number: t.tableNumber,
              label: t.label,
              capacity: t.capacity,
              status: t.status,
              active_order_id: t.activeOrderId,
              last_payment_method: t.lastPaymentMethod,
              updated_at: t.updatedAt,
            }))
          );
        }

        const menuPackMap = new Map(current.menuItems.map((m) => [m.id, m.packagingType || 'none']));
        const itemsByOrderId = new Map<string, Order['items']>();
        if (itemsRes.data) {
          for (const r of itemsRes.data) {
            const list = itemsByOrderId.get(r.order_id) || [];
            list.push({
              id: r.id,
              menuItemId: r.menu_item_id,
              name: r.name,
              price: Number(r.price),
              quantity: Number(r.quantity),
              notes: r.notes || undefined,
              packagingType: menuPackMap.get(r.menu_item_id) || 'none',
            });
            itemsByOrderId.set(r.order_id, list);
          }
        }

        if (ordersRes.data && ordersRes.data.length > 0) {
          current.orders = ordersRes.data.map((row) => ({
            id: row.id,
            orderNumber: row.order_number,
            tableNumber: Number(row.table_number),
            customerName: row.customer_name || `Table ${row.table_number} Guest`,
            customerPhone: row.customer_phone || undefined,
            orderType: (row.order_type as Order['orderType']) || 'DINE_IN',
            status: (row.status as OrderStatus) || 'PENDING',
            items: itemsByOrderId.get(row.id) || [],
            subtotal: Number(row.subtotal),
            tax: Number(row.tax || 0),
            total: Number(row.total),
            paymentStatus: (row.payment_status as PaymentStatus) || 'UNPAID',
            paymentMethod: (row.payment_method as PaymentMethod | null) || null,
            paymentReference: row.payment_reference || null,
            notes: row.notes || undefined,
            paidAt: row.paid_at || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at,
          }));
        }

        const orderNumMap = new Map(current.orders.map((o) => [o.id, o.orderNumber]));
        if (paymentsRes.data && paymentsRes.data.length > 0) {
          current.payments = paymentsRes.data.map((row) => ({
            id: row.id,
            orderId: row.order_id,
            orderNumber: orderNumMap.get(row.order_id) || row.order_id,
            tableNumber: Number(row.table_number),
            method: row.method as PaymentMethod,
            amount: Number(row.amount),
            referenceId: row.reference_id,
            accountOrPhone: row.account_or_phone || undefined,
            status: (row.status as PaymentRecord['status']) || 'COMPLETED',
            gatewayMode: (row.gateway_mode as PaymentRecord['gatewayMode']) || 'SANDBOX',
            createdAt: row.created_at,
          }));
        }

        if (invRes.data && invRes.data.length > 0) {
          current.inventory = invRes.data.map((row) => ({
            id: row.id,
            name: row.name,
            category: row.category || 'Packaging',
            quantity: Number(row.quantity),
            unit: row.unit || 'pieces',
            minThreshold: Number(row.min_threshold ?? 25),
            updatedAt: row.updated_at || new Date().toISOString(),
          }));
        } else if (!invRes.error) {
          await syncInventoryToSupabase(current.inventory);
        }

        if (expRes.data && expRes.data.length > 0) {
          current.expenses = expRes.data.map((row) => ({
            id: row.id,
            title: row.title,
            category: row.category || 'Operations',
            amount: Number(row.amount),
            notes: row.notes || undefined,
            recordedBy: row.recorded_by || undefined,
            createdAt: row.created_at,
          }));
        }

        writeDB(current);
        global.__velvetHydrated = true;
        return current;
      } catch (err) {
        console.error('[Supabase Hydrate] Exception:', err);
        return readDB();
      } finally {
        global.__velvetHydratePromise = undefined;
      }
    })();
  }

  return global.__velvetHydratePromise;
}

export async function syncTableToSupabase(table: CafeTable) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    const { error } = await sb.from('cafe_tables').upsert(
      {
        table_number: table.tableNumber,
        label: table.label,
        capacity: table.capacity,
        status: table.status,
        active_order_id: table.activeOrderId,
        last_payment_method: table.lastPaymentMethod,
        updated_at: table.updatedAt,
      },
      { onConflict: 'table_number' }
    );
    if (error) {
      console.error('[Supabase Sync] cafe_tables upsert error:', error);
    }
  } catch (err) {
    console.error('[Supabase Sync] Table sync error:', err);
  }
}

export async function syncOrderToSupabase(order: Order, table: CafeTable) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    const { error: tableErr } = await sb.from('cafe_tables').upsert({
      table_number: table.tableNumber,
      label: table.label,
      capacity: table.capacity,
      status: table.status,
      active_order_id: table.activeOrderId,
      last_payment_method: table.lastPaymentMethod,
      updated_at: table.updatedAt,
    });
    if (tableErr) {
      console.error('[Supabase Sync] cafe_tables upsert error:', tableErr);
    }

    const buildOrderPayload = (orderNumber: string) => ({
      id: order.id,
      order_number: orderNumber,
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

    let { error: orderErr } = await sb.from('orders').upsert(buildOrderPayload(order.orderNumber), {
      onConflict: 'id',
    });

    // Guard against order_number unique collision across container restarts
    if (orderErr && orderErr.code === '23505') {
      const uniqueOrderNumber = `${order.orderNumber}-${Date.now().toString().slice(-4)}`;
      order.orderNumber = uniqueOrderNumber;
      const db = readDB();
      const memOrder = db.orders.find((o) => o.id === order.id);
      if (memOrder) {
        memOrder.orderNumber = uniqueOrderNumber;
        writeDB(db);
      }
      const retry = await sb.from('orders').upsert(buildOrderPayload(uniqueOrderNumber), {
        onConflict: 'id',
      });
      orderErr = retry.error;
    }

    if (orderErr) {
      console.error('[Supabase Sync] orders upsert error:', orderErr);
      return;
    }

    if (order.items.length > 0) {
      const { error: itemsErr } = await sb.from('order_items').upsert(
        order.items.map((item) => ({
          id: item.id,
          order_id: order.id,
          menu_item_id: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
        { onConflict: 'id' }
      );
      if (itemsErr) {
        console.error('[Supabase Sync] order_items upsert error:', itemsErr);
      }
    }
  } catch (err) {
    console.error('[Supabase Sync] Order sync error:', err);
  }
}

export async function syncPaymentToSupabase(payment: PaymentRecord, order: Order, table: CafeTable) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    await syncOrderToSupabase(order, table);
    const { error: payErr } = await sb.from('payments').upsert(
      {
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
      },
      { onConflict: 'id' }
    );
    if (payErr) {
      console.error('[Supabase Sync] payments upsert error:', payErr);
    }
  } catch (err) {
    console.error('[Supabase Sync] Payment sync error:', err);
  }
}

export async function syncInventoryToSupabase(items: InventoryItem[]) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    const { error } = await sb.from('inventory_items').upsert(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        min_threshold: i.minThreshold,
        updated_at: i.updatedAt,
      })),
      { onConflict: 'id' }
    );
    if (error) {
      console.error('[Supabase Sync] inventory_items upsert error:', error);
    }
  } catch (err) {
    console.error('[Supabase Sync] Inventory sync error:', err);
  }
}

export async function syncExpenseToSupabase(expense: ExpenseRecord) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    const { error } = await sb.from('expenses').upsert(
      {
        id: expense.id,
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        notes: expense.notes || null,
        recorded_by: expense.recordedBy || null,
        created_at: expense.createdAt,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.error('[Supabase Sync] expenses upsert error:', error);
    }
  } catch (err) {
    console.error('[Supabase Sync] Expense sync error:', err);
  }
}

// ============================================================================
// HIGH-LEVEL DOMAIN HELPERS
// ============================================================================

export function generateOrderNumber(db: VelvetDatabase): string {
  let maxNum = 100;
  for (const ord of db.orders) {
    const match = /^VCG-(\d+)/i.exec(ord.orderNumber || '');
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `VCG-${maxNum + 1}`;
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
      if (table.activeOrderId === order.id) {
        table.status = 'AVAILABLE';
        table.activeOrderId = null;
      }
    } else if (order.paymentStatus === 'PAID') {
      // Paid orders leave the floor table blank/available for the next guest
      if (table.activeOrderId === order.id || table.status === 'PAID') {
        table.status = 'AVAILABLE';
        table.activeOrderId = null;
      }
    } else if (status === 'READY' || status === 'COMPLETED') {
      table.status = 'BILL_PENDING';
      table.activeOrderId = order.id;
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
    table.lastPaymentMethod = params.method;
    if (finalPayStatus === 'PAID') {
      // Once paid, reset the floor table to blank/AVAILABLE so new orders stand out clearly
      table.status = 'AVAILABLE';
      table.activeOrderId = null;
      table.lastPaidAt = now;
    } else {
      table.activeOrderId = order.id;
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
