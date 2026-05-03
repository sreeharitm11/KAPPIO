export type UserRole = 'ADMIN' | 'STAFF' | 'DELIVERY' | 'CUSTOMER';

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: string;
  available: boolean;
  isVeg: boolean;
  isPopular: boolean;
  imageUrl?: string | null;
  category: Category;
};

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERED';
export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';
export type PaymentStatus = 'PENDING' | 'PAID';

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  imageUrl?: string | null;
  description?: string | null;
  categoryName?: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  menuItemId: string;
  menuItem: MenuItem;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone: string;
  deliveryAddress: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  specialInstructions?: string | null;
  commentAcknowledged: boolean;
  subtotal: string;
  deliveryFee: string;
  totalAmount: string;
  estimatedDeliveryMinutes: number;
  latitude?: string | null;
  longitude?: string | null;
  deliveryDistance?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type DeliveryAssignment = {
  id: string;
  orderId: string;
  partnerId: string;
  status: DeliveryStatus;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  order: Order;
};

export type DashboardMetrics = {
  totalSales: number;
  totalExpenses: number;
  profitLoss: number;
  totalOrders: number;
};

export type DashboardResponse = {
  period: 'daily' | 'weekly' | 'monthly';
  metrics: DashboardMetrics;
  charts: {
    salesTrend: Array<{
      label: string;
      sales: number;
    }>;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName?: string | null;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
  }>;
};

export type TopItemsResponse = {
  period: 'daily' | 'weekly' | 'monthly';
  items: Array<{
    itemName: string;
    unitsSold: number;
    revenue: number;
  }>;
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'DIRECT' | 'INDIRECT';
  amount: string;
  createdAt: string;
};

export type CashbookEntry = {
  id: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  amount: string;
  balance: string;
  referenceType?: string | null;
  referenceId?: string | null;
};

export type FinanceSummary = {
  directExpenses: number;
  indirectExpenses: number;
  currentCashBalance: number;
};

export type SessionUser = {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
};

/** Stored client-side; access/refresh JWTs are httpOnly cookies */
export type AuthSession = {
  user: SessionUser;
};

export type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  pendingInvite?: boolean;
  aadhaar?: string | null;
  doj?: string | null;
  emergencyContact?: string | null;
  createdAt: string;
};

export type TeamInvitationResult = StaffMember & {
  inviteUrl: string;
  inviteExpiresAt: string;
};

export type Vendor = {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  fssaiNumber?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  currentStock: string;
  lowStockThreshold: string;
  lastStockCheckAt?: string;
};

export type InventoryLog = {
  id: string;
  ingredientId: string;
  changeAmount: string;
  balanceAfter: string;
  type: string;
  remarks?: string;
  createdAt: string;
};
