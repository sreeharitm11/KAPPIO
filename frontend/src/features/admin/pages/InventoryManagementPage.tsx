import { useEffect, useState } from "react";
import { Package, Plus, Minus, History, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fetchIngredients, updateIngredientStock, fetchIngredientLogs } from "../api/inventoryApi";
import type { Ingredient, InventoryLog } from "../../../shared/types/api";

export default function InventoryManagementPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchIngredients();
      setIngredients(data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSelect = async (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setAdjustment(0);
    setRemarks("");
    try {
      const logData = await fetchIngredientLogs(ing.id);
      setLogs(logData);
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedIngredient || adjustment === 0) return;
    try {
      await updateIngredientStock(selectedIngredient.id, adjustment, remarks);
      setSuccess(`Stock updated for ${selectedIngredient.name}`);
      void loadData();
      void handleSelect({ ...selectedIngredient }); // reload logs
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading inventory...</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-[#2C1810]">Inventory Management</h1>
        <p className="text-[#6B5D52]">Track and adjust raw material stock levels</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {ingredients.map((ing) => {
              const isLow = Number(ing.currentStock) <= Number(ing.lowStockThreshold);
              return (
                <button
                  key={ing.id}
                  onClick={() => handleSelect(ing)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    selectedIngredient?.id === ing.id
                      ? "border-[#D4A574] bg-[#FDF8F3] shadow-md"
                      : "border-[#E8DCC8] bg-white hover:border-[#D4A574]/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-[#F4E8D8] rounded-lg">
                      <Package className="w-5 h-5 text-[#B85C3E]" />
                    </div>
                    {isLow && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        LOW STOCK
                      </span>
                    )}
                  </div>
                  <h3 className="text-[#2C1810] mb-1">{ing.name}</h3>
                  <p className="text-2xl font-bold text-[#B85C3E]">
                    {ing.currentStock} <span className="text-sm font-normal text-[#6B5D52]">{ing.unit}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {selectedIngredient ? (
            <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-xl p-6 sticky top-6">
              <h3 className="text-[#2C1810] mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D4A574]" />
                Adjust Stock: {selectedIngredient.name}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#6B5D52] mb-3">Adjustment Amount ({selectedIngredient.unit})</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setAdjustment(prev => prev - 1)}
                      className="p-3 bg-[#F4E8D8] rounded-xl hover:bg-[#E8DCC8] transition-colors"
                    >
                      <Minus className="w-5 h-5 text-[#2C1810]" />
                    </button>
                    <input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(Number(e.target.value))}
                      className="flex-1 text-center text-xl font-bold bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                    />
                    <button 
                      onClick={() => setAdjustment(prev => prev + 1)}
                      className="p-3 bg-[#F4E8D8] rounded-xl hover:bg-[#E8DCC8] transition-colors"
                    >
                      <Plus className="w-5 h-5 text-[#2C1810]" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5D52] mb-2">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g., End of day count, Purchase, Spillage..."
                    className="w-full px-4 py-2 border-2 border-[#E8DCC8] rounded-xl bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                    rows={2}
                  />
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={adjustment === 0}
                  className="w-full bg-[#B85C3E] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#A04B30] transition-colors disabled:opacity-50"
                >
                  Confirm Adjustment
                </button>

                <div className="pt-6 border-t-2 border-[#E8DCC8]">
                  <h4 className="text-sm font-bold text-[#2C1810] mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Recent History
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {logs.map((log) => (
                      <div key={log.id} className="text-xs border-b border-[#F4E8D8] pb-2 last:border-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-[#2C1810]">
                            {Number(log.changeAmount) > 0 ? "+" : ""}{log.changeAmount} {selectedIngredient.unit}
                          </span>
                          <span className="text-[#9E8E81]">{new Date(log.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[#6B5D52] italic">{log.type}: {log.remarks}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F4E8D8]/30 border-2 border-dashed border-[#E8DCC8] rounded-2xl p-12 text-center">
              <Package className="w-12 h-12 text-[#D4A574] mx-auto mb-4 opacity-50" />
              <p className="text-[#6B5D52]">Select an ingredient to view history and adjust stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
