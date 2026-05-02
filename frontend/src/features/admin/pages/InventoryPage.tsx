import { useEffect, useState } from "react";
import { Package, Plus, Minus, History, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fetchIngredients, updateIngredientStock, fetchIngredientLogs } from "../api/inventoryApi";
import type { Ingredient, InventoryLog } from "../../../shared/types/api";

export default function InventoryPage() {
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
      
      // Refresh logs for the selected ingredient
      const logData = await fetchIngredientLogs(selectedIngredient.id);
      setLogs(logData);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B5D52]">Loading inventory...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[#2C1810]">Inventory Management</h1>
        <p className="text-[#6B5D52] mt-1">Track raw materials, stock levels, and manual adjustments</p>
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
                  className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedIngredient?.id === ing.id
                      ? "border-[#D4A574] bg-[#FDF8F3] shadow-md"
                      : "border-[#E8DCC8] bg-white hover:border-[#D4A574]/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-[#F4E8D8] rounded-xl">
                      <Package className="w-6 h-6 text-[#B85C3E]" />
                    </div>
                    {isLow && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        LOW STOCK
                      </span>
                    )}
                  </div>
                  <h3 className="text-[#2C1810] font-bold text-lg mb-1">{ing.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#B85C3E]">{ing.currentStock}</span>
                    <span className="text-[#6B5D52] font-medium">{ing.unit}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E8DCC8]/50">
                    <p className="text-xs text-[#9E8E81] uppercase tracking-wider font-bold">Min Threshold: {ing.lowStockThreshold} {ing.unit}</p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {ingredients.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8DCC8] p-12 text-center">
              <Package className="w-16 h-16 text-[#D4A574]/30 mx-auto mb-4" />
              <h3 className="text-[#2C1810] mb-2">No ingredients found</h3>
              <p className="text-[#6B5D52]">Run the inventory seed or add ingredients in the database to get started.</p>
            </div>
          )}
        </div>

        <div>
          {selectedIngredient ? (
            <div className="bg-white rounded-3xl border-2 border-[#E8DCC8] shadow-2xl p-8 sticky top-8">
              <h3 className="text-[#2C1810] text-xl font-bold mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-[#D4A574]" />
                Adjust Stock
              </h3>
              
              <div className="mb-8 p-4 bg-[#FBF8F3] rounded-2xl border border-[#E8DCC8]">
                <p className="text-sm text-[#6B5D52] mb-1">Selected Material</p>
                <p className="text-lg font-bold text-[#2C1810]">{selectedIngredient.name}</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-[#6B5D52] mb-4 uppercase tracking-widest">
                    Adjustment Amount ({selectedIngredient.unit})
                  </label>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setAdjustment(prev => prev - 1)}
                      className="w-12 h-12 flex items-center justify-center bg-[#F4E8D8] rounded-2xl hover:bg-[#E8DCC8] transition-colors shadow-sm"
                    >
                      <Minus className="w-6 h-6 text-[#2C1810]" />
                    </button>
                    <input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(Number(e.target.value))}
                      className="flex-1 text-center text-3xl font-black bg-transparent border-b-4 border-[#D4A574] py-2 focus:outline-none focus:border-[#B85C3E] text-[#2C1810]"
                    />
                    <button 
                      onClick={() => setAdjustment(prev => prev + 1)}
                      className="w-12 h-12 flex items-center justify-center bg-[#F4E8D8] rounded-2xl hover:bg-[#E8DCC8] transition-colors shadow-sm"
                    >
                      <Plus className="w-6 h-6 text-[#2C1810]" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#6B5D52] mb-3 uppercase tracking-widest">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g., End of day count, Purchase..."
                    className="w-full px-5 py-4 border-2 border-[#E8DCC8] rounded-2xl bg-[#FBF8F3] focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all resize-none text-[#2C1810]"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={adjustment === 0}
                  className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#D4A574]/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Confirm Adjustment
                </button>

                <div className="pt-8 border-t-2 border-[#E8DCC8]">
                  <h4 className="text-sm font-black text-[#2C1810] mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <History className="w-5 h-5 text-[#D4A574]" />
                    Activity Logs
                  </h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-[#D4A574] scrollbar-track-transparent">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 bg-[#FBF8F3] rounded-2xl border border-[#E8DCC8]/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-black text-sm ${Number(log.changeAmount) > 0 ? "text-green-600" : "text-red-600"}`}>
                            {Number(log.changeAmount) > 0 ? "+" : ""}{log.changeAmount} {selectedIngredient.unit}
                          </span>
                          <span className="text-[10px] font-bold text-[#9E8E81] uppercase tracking-tighter">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-[#2C1810] font-medium leading-relaxed">
                          <span className="opacity-60 uppercase text-[9px] mr-1">Type:</span> {log.type}
                        </div>
                        {log.remarks && (
                          <div className="mt-1 text-xs text-[#6B5D52] italic">"{log.remarks}"</div>
                        )}
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-center text-sm text-[#9E8E81] py-8">No logs yet</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F4E8D8]/20 border-4 border-dashed border-[#E8DCC8] rounded-[2rem] p-16 text-center h-full flex flex-col justify-center items-center">
              <div className="p-6 bg-white rounded-full shadow-inner mb-6">
                <Package className="w-16 h-16 text-[#D4A574] opacity-40" />
              </div>
              <h3 className="text-[#2C1810] font-bold mb-2">Select Material</h3>
              <p className="text-[#6B5D52] max-w-[200px] mx-auto text-sm">Pick an ingredient from the left to adjust stock levels</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
