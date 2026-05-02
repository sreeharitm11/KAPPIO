import { api } from '../../../shared/lib/api-client';
import type { Ingredient, InventoryLog } from '../../../shared/types/api';

export const fetchIngredients = async () => {
  const response = await api.get<Ingredient[]>('/inventory/ingredients');
  return response.data;
};

export const updateIngredientStock = async (id: string, amount: number, remarks?: string) => {
  const response = await api.patch<Ingredient>(`/inventory/ingredients/${id}/stock`, {
    amount,
    remarks,
  });
  return response.data;
};

export const fetchIngredientLogs = async (id: string) => {
  const response = await api.get<InventoryLog[]>(`/inventory/ingredients/${id}/logs`);
  return response.data;
};
