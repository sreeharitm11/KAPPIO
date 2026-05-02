import { useState } from "react";
import { Plus, AlertTriangle, Package } from "lucide-react";

const inventoryData = [
  { id: 1, name: "Tomatoes", quantity: 50, unit: "kg", minStock: 20, lastPurchase: "2026-04-28", price: 40 },
  { id: 2, name: "Cheese", quantity: 15, unit: "kg", minStock: 25, lastPurchase: "2026-04-30", price: 450 },
  { id: 3, name: "Chicken", quantity: 30, unit: "kg", minStock: 15, lastPurchase: "2026-05-01", price: 180 },
  { id: 4, name: "Flour", quantity: 100, unit: "kg", minStock: 40, lastPurchase: "2026-04-25", price: 35 },
  { id: 5, name: "Onions", quantity: 8, unit: "kg", minStock: 15, lastPurchase: "2026-04-27", price: 30 },
  { id: 6, name: "Olive Oil", quantity: 25, unit: "L", minStock: 10, lastPurchase: "2026-04-29", price: 600 },
];

const purchaseHistory = [
  { id: 1, date: "2026-05-01", items: "Chicken (30kg)", supplier: "Fresh Meats Co.", total: 5400 },
  { id: 2, date: "2026-04-30", items: "Cheese (15kg)", supplier: "Dairy Suppliers", total: 6750 },
  { id: 3, date: "2026-04-29", items: "Olive Oil (25L)", supplier: "Import Foods", total: 15000 },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<"stock" | "purchases">("stock");

  const lowStockItems = inventoryData.filter(item => item.quantity < item.minStock);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track raw materials, stock levels, and purchases</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Purchase
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-red-900 mb-2">Low Stock Alert</h4>
              <div className="space-y-1">
                {lowStockItems.map(item => (
                  <p key={item.id} className="text-sm text-red-700">
                    {item.name}: {item.quantity}{item.unit} (Min: {item.minStock}{item.unit})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "stock"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Stock Levels
            </button>
            <button
              onClick={() => setActiveTab("purchases")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "purchases"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Purchase History
            </button>
          </div>
        </div>

        {activeTab === "stock" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Material</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Current Stock</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Min Stock</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Last Purchase</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Price/Unit</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventoryData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      {item.name}
                    </td>
                    <td className="px-6 py-4">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.minStock} {item.unit}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.lastPurchase}</td>
                    <td className="px-6 py-4">₹{item.price}/{item.unit}</td>
                    <td className="px-6 py-4">
                      {item.quantity < item.minStock ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Items</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Supplier</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchaseHistory.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{purchase.date}</td>
                    <td className="px-6 py-4">{purchase.items}</td>
                    <td className="px-6 py-4 text-muted-foreground">{purchase.supplier}</td>
                    <td className="px-6 py-4">₹{purchase.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
