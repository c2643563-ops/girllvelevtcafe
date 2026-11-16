export type StaffRole = 'OWNER' | 'CASHIER' | 'KITCHEN' | 'WAITER';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_PENDING' | 'PAID';

export interface CafeTable {
  tableNumber: number;
  label: string;
  capacity: number;
  status: TableStatus;
  activeOrderId: string | null;
  lastPaymentMethod: PaymentMethod | null;
  lastPaidAt: string | null;
  updatedAt: string;
}

export type PackagingType = 'burger' | 'fries' | 'drink' | 'none';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  tag?: string;
  prepMinutes: number;
  isAvailable: boolean;
  packagingType: PackagingType;
  accentColor?: string;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID';
export type PaymentMethod = 'CASH' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER';
export type OrderType = 'DINE_IN' | 'TAKEAWAY';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  packagingType?: PackagingType;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customerName: string;
  customerPhone?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  notes?: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  tableNumber: number;
  method: PaymentMethod;
  amount: number;
  referenceId: string;
  accountOrPhone?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  gatewayMode: 'SANDBOX' | 'PRODUCTION';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface VelvetDatabase {
  staffUsers: StaffUser[];
  tables: CafeTable[];
  menuItems: MenuItem[];
  orders: Order[];
  payments: PaymentRecord[];
  inventory: InventoryItem[];
  expenses: ExpenseRecord[];
}
