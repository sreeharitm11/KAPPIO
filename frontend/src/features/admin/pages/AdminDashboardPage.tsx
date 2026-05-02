import { useEffect, useState } from "react";
import { Link } from "react-router";
import { DollarSign, TrendingUp, ShoppingCart, TrendingDown, Menu, Users } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchDashboard } from "../../reports/api/reportsApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { DashboardResponse } from "../../../shared/types/api";

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setDashboard(await fetchDashboard("daily"));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
      }
    };

    void load();
  }, []);

  const salesData = dashboard?.charts.salesTrend.map((entry) => ({
    name: entry.label,
    sales: entry.sales,
  })) ?? [];

  const expensesData = [
    { name: "Expenses", value: dashboard?.metrics.totalExpenses ?? 0, color: "#ef4444" },
    { name: "Profit", value: Math.max(0, dashboard?.metrics.profitLoss ?? 0), color: "#10b981" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/admin/menu"
          className="flex items-center gap-4 p-5 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
            <Menu className="w-6 h-6 text-amber-800" />
          </div>
          <div>
            <p className="font-medium text-foreground">Update menu</p>
            <p className="text-sm text-muted-foreground">Categories, items, prices, availability</p>
          </div>
        </Link>
        <Link
          to="/admin/team"
          className="flex items-center gap-4 p-5 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-800" />
          </div>
          <div>
            <p className="font-medium text-foreground">Team &amp; delivery</p>
            <p className="text-sm text-muted-foreground">Add delivery partners and review staff</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h2 className="mb-1">{formatCurrency(dashboard?.metrics.totalSales ?? 0)}</h2>
          <p className="text-sm text-green-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Live from backend
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <h2 className="mb-1">{formatCurrency(dashboard?.metrics.totalExpenses ?? 0)}</h2>
          <p className="text-sm text-muted-foreground">Materials & Operations</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Profit/Loss</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h2 className="mb-1 text-green-600">{formatCurrency(dashboard?.metrics.profitLoss ?? 0)}</h2>
          <p className="text-sm text-muted-foreground">Net profit today</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <h2 className="mb-1">{dashboard?.metrics.totalOrders ?? 0}</h2>
          <p className="text-sm text-muted-foreground">Orders today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="mb-4">Sales Trend (This Week)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expensesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3>Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Order ID</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Items</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Total</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(dashboard?.recentOrders ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{order.orderNumber}</td>
                  <td className="px-6 py-4">{order.customerName ?? "Walk-in Customer"}</td>
                  <td className="px-6 py-4 text-muted-foreground">View in orders page</td>
                  <td className="px-6 py-4">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-700"
                          : order.status === "PREPARING"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
