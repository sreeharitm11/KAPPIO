import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { fetchCategories, fetchMenu, toggleMenuItemAvailability } from "../../menu/api/menuApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { Category, MenuItem } from "../../../shared/types/api";

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "items">("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryData, menuData] = await Promise.all([
          fetchCategories(),
          fetchMenu({ limit: 100 }),
        ]);
        setCategories(categoryData);
        setItems(menuData.items);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load menu");
      }
    };

    void load();
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [items, searchQuery],
  );

  const toggleAvailability = async (itemId: string) => {
    try {
      await toggleMenuItemAvailability(itemId);
      const menuData = await fetchMenu({ limit: 100 });
      setItems(menuData.items);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update availability");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage your restaurant menu and categories</p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === "categories" ? "Category" : "Item"}
        </button>
      </div>

      {showAddModal && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Create and edit forms are the next step. This screen is now reading live backend data and toggling availability against the API.
        </div>
      )}

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab("items")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "items"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Menu Items
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "categories"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {activeTab === "items" && (
          <div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Item Name</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Category</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Price</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Availability</th>
                    <th className="px-6 py-3 text-right text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {item.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => void toggleAvailability(item.id)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            item.available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.available ? "Available" : "Out of Stock"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 p-2">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3>{category.name}</h3>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {items.filter((item) => item.categoryId === category.id).length} items
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
