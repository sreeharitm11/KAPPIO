import type { CartItem } from '../../../shared/types/api';

const STORAGE_KEY = 'kappio.order';

type OrderStoreState = {
  items: CartItem[];
  specialInstructions: string;
  status: string;
  commentAcknowledged: boolean;
  lastOrderNumber?: string;
};

const defaultState: OrderStoreState = {
  items: [],
  specialInstructions: '',
  status: 'pending',
  commentAcknowledged: false,
  lastOrderNumber: undefined,
};

function readState(): OrderStoreState {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) {
    return defaultState;
  }

  try {
    return { ...defaultState, ...(JSON.parse(value) as Partial<OrderStoreState>) };
  } catch {
    return defaultState;
  }
}

let currentOrder = readState();

function persist() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrder));
  }
}

export const orderStore = {
  getOrder: () => currentOrder,
  updateOrder: (data: Partial<OrderStoreState>) => {
    currentOrder = { ...currentOrder, ...data };
    persist();
  },
  addItem: (item: CartItem) => {
    const existing = currentOrder.items.find((entry) => entry.menuItemId === item.menuItemId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      currentOrder.items = [...currentOrder.items, item];
    }
    persist();
  },
  updateQuantity: (menuItemId: string, quantity: number) => {
    currentOrder.items = currentOrder.items
      .map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    persist();
  },
  removeItem: (menuItemId: string) => {
    currentOrder.items = currentOrder.items.filter((item) => item.menuItemId !== menuItemId);
    persist();
  },
  reset: () => {
    currentOrder = defaultState;
    persist();
  },
};
