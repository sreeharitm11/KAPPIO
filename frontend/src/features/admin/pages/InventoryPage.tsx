import { useEffect, useState, useMemo } from "react";
import { Package, Plus, Minus, History, AlertTriangle, CheckCircle2, Search, X, Sparkles, Download, FileText, Calendar, Coffee } from "lucide-react";
import { fetchIngredients, updateIngredientStock, fetchIngredientLogs, createIngredient } from "../api/inventoryApi";
import type { Ingredient, InventoryLog } from "../../../shared/types/api";

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search & Optimization
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', unit: 'kg', currentStock: '0', lowStockThreshold: '5' });

  const handleSeed = async () => {
    if (!confirm("Are you sure you want to initialize the database with demo menu items?")) return;
    try {
      setLoading(true);
      const { api } = await import("../../../shared/lib/api-client");
      await api.post("/inventory/seed");
      alert("Database seeded successfully! Items will now appear in the menu.");
      await loadData();
    } catch (err) {
      alert("Seeding failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const data = await fetchIngredients();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load inventory", err);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredIngredients = useMemo(() => {
    const list = Array.isArray(ingredients) ? ingredients : [];
    if (!searchTerm) return list;
    return list.filter(ing => 
      ing?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingredients, searchTerm]);

  const handleSelect = async (ing: Ingredient) => {
    if (!ing) return;
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
      
      const logData = await fetchIngredientLogs(selectedIngredient.id);
      setLogs(logData);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  const handleCreate = async () => {
    if (!newIng.name) return;
    try {
      await createIngredient(newIng);
      setSuccess(`Created new ingredient: ${newIng.name}`);
      setIsCreateModalOpen(false);
      setNewIng({ name: '', unit: 'kg', currentStock: '0', lowStockThreshold: '5' });
      void loadData();
    } catch (err) {
      console.error("Failed to create", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B5D52]">Loading inventory...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[#2C1810]">Inventory Management</h1>
          <p className="text-[#6B5D52] mt-1">Track raw materials, stock levels, and manual adjustments</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSeed}
            className="flex items-center justify-center gap-2 bg-white border-2 border-[#D4A574] text-[#B85C3E] px-6 py-3 rounded-2xl font-bold hover:bg-[#FDF8F3] transition-all active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            Seed Demo Data
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#2C1810] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-[#402A20] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Material
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Search Bar - Critical for performance and usability */}
      <div className="mb-8 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9E8E81]" />
        <input 
          type="text"
          placeholder="Search materials by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:border-[#D4A574] transition-colors text-[#2C1810] font-medium shadow-sm"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#F4E8D8] rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-[#9E8E81]" />
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {(filteredIngredients ?? []).map((ing) => {
              const isLow = Number(ing.currentStock) <= Number(ing.lowStockThreshold);
              return (
                <button
                  key={ing.id}
                  onClick={() => handleSelect(ing)}
                  className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedIngredient?.id === ing.id
                      ? "border-[#D4A574] bg-[#FDF8F3] shadow-md ring-2 ring-[#D4A574]/20"
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
          
          {filteredIngredients?.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8DCC8] p-12 text-center">
              <Package className="w-16 h-16 text-[#D4A574]/30 mx-auto mb-4" />
              <h3 className="text-[#2C1810] mb-2">No materials found</h3>
              <p className="text-[#6B5D52]">
                {searchTerm ? "Try a different search term" : "Add ingredients to get started"}
              </p>
            </div>
          )}
        </div>

        <div className="relative">
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
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#D4A574] scrollbar-track-transparent">
                    {(logs ?? []).map((log) => (
                      <div key={log.id} className="p-4 bg-[#FBF8F3] rounded-2xl border border-[#E8DCC8]/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-black text-sm ${Number(log.changeAmount) > 0 ? "text-green-600" : "text-red-600"}`}>
                            {Number(log.changeAmount) > 0 ? "+" : ""}{log.changeAmount} {selectedIngredient.unit}
                          </span>
                          <span className="text-[10px] font-bold text-[#9E8E81] uppercase tracking-tighter">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#2C1810] font-bold opacity-60 uppercase mb-1">{log.type}</p>
                        {log.remarks && (
                          <div className="text-xs text-[#6B5D52] italic leading-tight">"{log.remarks}"</div>
                        )}
                      </div>
                    ))}
                    {(!logs || logs.length === 0) && <p className="text-center text-sm text-[#9E8E81] py-8">No logs yet</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F4E8D8]/20 border-4 border-dashed border-[#E8DCC8] rounded-[2rem] p-16 text-center h-[600px] flex flex-col justify-center items-center sticky top-8">
              <div className="p-6 bg-white rounded-full shadow-inner mb-6">
                <Package className="w-16 h-16 text-[#D4A574] opacity-40" />
              </div>
              <h3 className="text-[#2C1810] font-bold mb-2">Select Material</h3>
              <p className="text-[#6B5D52] max-w-[200px] mx-auto text-sm">Pick an ingredient from the left to adjust stock levels</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1810]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#2C1810]">Add Material</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-[#F4E8D8] rounded-full">
                <X className="w-6 h-6 text-[#2C1810]" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#9E8E81] uppercase mb-2 tracking-widest">Material Name</label>
                <input 
                  type="text"
                  value={newIng.name}
                  onChange={(e) => setNewIng(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Milk, Sugar, Coffee Beans"
                  className="w-full px-6 py-4 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:border-[#D4A574]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#9E8E81] uppercase mb-2 tracking-widest">Unit</label>
                  <select 
                    value={newIng.unit}
                    onChange={(e) => setNewIng(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-6 py-4 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:border-[#D4A574]"
                  >
                    <option value="kg">kg</option>
                    <option value="ltr">ltr</option>
                    <option value="pcs">pcs</option>
                    <option value="gms">gms</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#9E8E81] uppercase mb-2 tracking-widest">Threshold</label>
                  <input 
                    type="number"
                    value={newIng.lowStockThreshold}
                    onChange={(e) => setNewIng(p => ({ ...p, lowStockThreshold: e.target.value }))}
                    className="w-full px-6 py-4 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:border-[#D4A574]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#9E8E81] uppercase mb-2 tracking-widest">Initial Stock</label>
                <input 
                  type="number"
                  value={newIng.currentStock}
                  onChange={(e) => setNewIng(p => ({ ...p, currentStock: e.target.value }))}
                  className="w-full px-6 py-4 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:border-[#D4A574]"
                />
              </div>

              <button 
                onClick={handleCreate}
                disabled={!newIng.name}
                className="w-full bg-[#B85C3E] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#B85C3E]/20 hover:bg-[#A04D32] transition-all disabled:opacity-50"
              >
                Create Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
