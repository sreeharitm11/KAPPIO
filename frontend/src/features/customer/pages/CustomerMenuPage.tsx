import React, { useEffect, useState, useMemo, memo } from "react";
import { Link } from "react-router";
import { Plus, Search, Sparkles, ShoppingCart } from "lucide-react";
import { fetchCategories, fetchMenu } from "../../menu/api/menuApi";
import { useOrderStore } from "../../orders/store/orderStore";
import { formatCurrency } from "../../../shared/lib/format";
import type { MenuItem } from "../../../shared/types/api";

type DietFilter = "ALL" | "VEG" | "NON_VEG";

const DIET_OPTIONS: { id: DietFilter; label: string; color: string; activeColor: string }[] = [
  { id: "ALL",     label: "All",     color: "border-[#E8DCC8] text-[#6B5D52]",                         activeColor: "bg-[#2C1810] border-[#2C1810] text-white" },
  { id: "VEG",     label: "🌿 Veg",  color: "border-green-200 text-green-700 bg-green-50",              activeColor: "bg-green-600 border-green-600 text-white" },
  { id: "NON_VEG", label: "🍗 Non-Veg", color: "border-red-200 text-red-700 bg-red-50",                activeColor: "bg-red-600 border-red-600 text-white" },
];

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      title={isVeg ? "Pure Veg" : "Non-Veg"}
      className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-[3px] flex-shrink-0 ${
        isVeg ? "border-green-600" : "border-red-600"
      }`}
    >
      <span className={`block w-2 h-2 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
    </span>
  );
}

/**
 * Memoized Menu Item Card to prevent unnecessary re-renders of the entire list
 * when one item is added to cart or when scrolling.
 */
const MenuItemCard = memo(({ item, onAdd, isAdded }: { item: MenuItem; onAdd: (i: MenuItem) => void; isAdded: boolean }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE5D8] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="flex gap-3 p-4">
        {/* Image */}
        <div className="relative flex-shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden bg-gradient-to-br from-[#F4E8D8] to-[#E8DCC8]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement!;
                if (!parent.querySelector(".fallback-emoji")) {
                  const span = document.createElement("span");
                  span.className = "fallback-emoji absolute inset-0 flex items-center justify-center text-4xl";
                  span.textContent = "🍽️";
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-4xl">🍽️</span>
          )}
          {item.isPopular && (
            <div className="absolute top-1 left-1 bg-[#B85C3E] text-white text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              Hot
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <VegDot isVeg={item.isVeg} />
              <h3 className="text-[#2C1810] font-bold text-[15px] leading-tight truncate">
                {item.name}
              </h3>
            </div>
          </div>
          {item.description && (
            <p className="text-[#8B7B72] text-xs leading-relaxed line-clamp-2 mb-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[#B85C3E] font-black text-lg">
              {formatCurrency(item.price)}
            </span>
            <button
              onClick={() => onAdd(item)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isAdded
                  ? "bg-green-500 text-white scale-95"
                  : "bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white hover:shadow-lg hover:scale-105 active:scale-95"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {isAdded ? "Added!" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function CustomerMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery]           = useState("");
  const [categories, setCategories]             = useState<string[]>(["All"]);
  const [menuItems, setMenuItems]               = useState<MenuItem[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [dietFilter, setDietFilter]             = useState<DietFilter>("ALL");
  const [addedId, setAddedId]                   = useState<string | null>(null);

  // Reactive Cart Count from Zustand (Selector optimization)
  const cartCount = useOrderStore((state) => state.items.reduce((s, i) => s + i.quantity, 0));
  const addItem = useOrderStore((state) => state.addItem);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryData, menuData] = await Promise.all([
          fetchCategories(),
          fetchMenu({ availableOnly: true, limit: 100 }),
        ]);
        setCategories(["All", ...categoryData.map((c) => c.name)]);
        setMenuItems(menuData.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load menu");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // Memoized filtering to prevent expensive operations on every render
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return menuItems.filter((item) => {
      const matchCat    = selectedCategory === "All" || item.category.name === selectedCategory;
      const matchSearch = !query || item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      const matchDiet   =
        dietFilter === "ALL" ||
        (dietFilter === "VEG" && item.isVeg) ||
        (dietFilter === "NON_VEG" && !item.isVeg);
      return matchCat && matchSearch && matchDiet;
    });
  }, [menuItems, selectedCategory, searchQuery, dietFilter]);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      isVeg: item.isVeg,
      imageUrl: item.imageUrl,
      description: item.description ?? undefined,
      categoryName: item.category.name,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 700);
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#FBF8F3] min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2C1810] via-[#5C2D14] to-[#B85C3E] text-white px-5 pt-8 pb-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-[#D4A574] text-xs font-bold uppercase tracking-[0.2em] mb-1">Kappio Café Menu</p>
          <h1 className="text-3xl font-black leading-tight">
            Discover<br />
            <span className="text-[#D4A574]">Delicious</span>
          </h1>
          <p className="text-white/70 text-sm mt-1">Handcrafted with love ☕</p>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 -mt-5 mb-5 relative z-10">
        <div className="relative shadow-xl">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#B85C3E]" />
          <input
            type="text"
            placeholder="Search food, drinks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-0 bg-white text-[#2C1810] placeholder-[#B0A09A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] transition-all"
          />
        </div>
      </div>

      {/* ── DIET FILTER ── */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDietFilter(opt.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                dietFilter === opt.id ? opt.activeColor : `bg-white ${opt.color}`
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div className="mb-5">
        <p className="px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B85C3E] mb-2">
          Categories
        </p>
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-[#B85C3E] border-[#B85C3E] text-white shadow-md shadow-[#B85C3E]/30"
                    : "bg-white border-[#E8DCC8] text-[#2C1810] hover:border-[#B85C3E] hover:text-[#B85C3E]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESULTS LABEL ── */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6B5D52]">
          {selectedCategory === "All" ? "All Items" : selectedCategory}
          {" "}<span className="text-[#B85C3E]">({filteredItems.length})</span>
        </p>
      </div>

      {/* ── MENU ITEMS ── */}
      <div className="px-4 pb-28 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#6B5D52] text-sm">Loading menu…</p>
          </div>
        )}
        {error && (
          <div className="text-center py-10 text-red-500 text-sm">{error}</div>
        )}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-[#2C1810] font-bold text-lg">No items found</p>
            <p className="text-[#6B5D52] text-sm mt-1">Try a different category or filter</p>
          </div>
        )}

        {filteredItems.map((item) => (
          <MenuItemCard 
            key={item.id} 
            item={item} 
            onAdd={handleAddToCart} 
            isAdded={addedId === item.id} 
          />
        ))}
      </div>

      {/* ── CART FLOATING BAR ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30 animate-in slide-in-from-bottom-10 duration-300">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/cart"
              className="bg-gradient-to-r from-[#2C1810] to-[#B85C3E] text-white rounded-2xl shadow-2xl flex items-center justify-between px-5 py-4 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="font-bold">
                  {cartCount} item{cartCount > 1 ? "s" : ""} in cart
                </span>
              </div>
              <span className="font-bold text-[#D4A574]">View Cart →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
