import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Sparkles } from "lucide-react";
import { fetchCategories, fetchMenu } from "../../menu/api/menuApi";
import { orderStore } from "../../orders/store/orderStore";
import { formatCurrency } from "../../../shared/lib/format";
import type { MenuItem } from "../../../shared/types/api";

export default function CustomerMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [categoryData, menuData] = await Promise.all([
          fetchCategories(),
          fetchMenu({ availableOnly: true, limit: 100 }),
        ]);

        setCategories(["All", ...categoryData.map((category) => category.name)]);
        setMenuItems(menuData.items);
        const items = orderStore.getOrder().items;
        setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load menu");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category.name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    orderStore.addItem({
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      imageUrl: item.imageUrl,
      description: item.description ?? undefined,
      categoryName: item.category.name,
    });
    const items = orderStore.getOrder().items;
    setCartCount(items.reduce((sum, entry) => sum + entry.quantity, 0));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-[#B85C3E] via-[#D4A574] to-[#6B9B8F] text-white p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
        <div className="relative">
          <h1 className="mb-2 text-3xl">Discover Delicious</h1>
          <p className="opacity-90 text-lg">Handcrafted with love ☕</p>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5D52]" />
          <input
            type="text"
            placeholder="Search for your favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="px-4 mb-6 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white shadow-lg"
                  : "bg-white text-[#2C1810] border-2 border-[#E8DCC8] hover:border-[#D4A574]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 grid gap-5">
        {loading && <p className="text-center text-[#6B5D52]">Loading menu...</p>}
        {error && <p className="text-center text-[#C14953]">{error}</p>}
        {!loading && !error && filteredItems.length === 0 && (
          <p className="text-center text-[#6B5D52]">No menu items found.</p>
        )}

        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
            <div className="p-5 flex gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-[#F4E8D8] to-[#E8DCC8] rounded-xl flex items-center justify-center text-5xl relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  "🍽️"
                )}
                {item.isPopular && (
                  <div className="absolute -top-1 -right-1 bg-[#B85C3E] text-white rounded-full p-1">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-[#2C1810]">{item.name}</h3>
                  {item.isPopular && (
                    <span className="text-xs bg-[#B85C3E] text-white px-2 py-1 rounded-full">Popular</span>
                  )}
                </div>
                <p className="text-sm text-[#6B5D52] mb-3 leading-relaxed">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl text-[#B85C3E]">{formatCurrency(item.price)}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/cart"
              className="bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-5 rounded-2xl shadow-2xl flex items-center justify-between hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <span className="text-lg">{cartCount} items added</span>
              <span className="text-lg">View Cart →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
