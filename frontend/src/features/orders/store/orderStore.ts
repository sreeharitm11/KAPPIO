import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '../../../shared/types/api';

type OrderStoreState = {
  items: CartItem[];
  specialInstructions: string;
  status: string;
  commentAcknowledged: boolean;
  lastOrderNumber?: string;
  tableNumber?: string;
  
  // Actions
  addItem: (item: CartItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  updateOrder: (data: Partial<Omit<OrderStoreState, 'items' | 'addItem' | 'updateQuantity' | 'removeItem' | 'reset'>>) => void;
  reset: () => void;
};

const defaultValues = {
  items: [],
  specialInstructions: '',
  status: 'pending',
  commentAcknowledged: false,
  lastOrderNumber: undefined,
  tableNumber: undefined,
};

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set) => ({
      ...defaultValues,

      addItem: (item) => set((state) => {
        const existing = state.items.find((entry) => entry.menuItemId === item.menuItemId);
        if (existing) {
          return {
            items: state.items.map((entry) =>
              entry.menuItemId === item.menuItemId
                ? { ...entry, quantity: entry.quantity + item.quantity }
                : entry
            ),
          };
        }
        return { items: [...state.items, item] };
      }),

      updateQuantity: (menuItemId, quantity) => set((state) => ({
        items: state.items
          .map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0),
      })),

      removeItem: (menuItemId) => set((state) => ({
        items: state.items.filter((item) => item.menuItemId !== menuItemId),
      })),

      updateOrder: (data) => set((state) => ({ ...state, ...data })),

      reset: () => set(defaultValues),
    }),
    {
      name: 'kappio.order',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Backward compatibility wrapper (to avoid rewriting all imports immediately)
export const orderStore = {
  getOrder: () => useOrderStore.getState(),
  addItem: (item: CartItem) => useOrderStore.getState().addItem(item),
  updateQuantity: (id: string, q: number) => useOrderStore.getState().updateQuantity(id, q),
  removeItem: (id: string) => useOrderStore.getState().removeItem(id),
  updateOrder: (data: any) => useOrderStore.getState().updateOrder(data),
  reset: () => useOrderStore.getState().reset(),
};
