import { useEffect, useState } from "react";
import { Download, FileText, Calendar } from "lucide-react";
import { exportReport, fetchDashboard, fetchTopItems } from "../../reports/api/reportsApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { DashboardResponse, TopItemsResponse } from "../../../shared/types/api";

export default function ReportsPage() {
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [topItems, setTopItems] = useState<TopItemsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, topItemsData] = await Promise.all([
          fetchDashboard(filter),
          fetchTopItems(filter),
        ]);
        setDashboard(dashboardData);
        setTopItems(topItemsData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load reports");
      }
    };

    void load();
  }, [filter]);

  const exportToCSV = async () => {
    try {
      const file = await exportReport(filter);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kappio-report-${filter}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      alert(exportError instanceof Error ? exportError.message : "Unable to export CSV");
    }
  };

  const metrics = dashboard?.metrics ?? {
    totalSales: 0,
    totalOrders: 0,
    totalExpenses: 0,
    profitLoss: 0,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">View and export business reports</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={() => void exportToCSV()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm mb-6">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3>Select Time Period</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter("daily")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                filter === "daily"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setFilter("weekly")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                filter === "weekly"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setFilter("monthly")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                filter === "monthly"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
          <h2 className="text-blue-600 mb-1">{formatCurrency(metrics.totalSales)}</h2>
          <p className="text-sm text-muted-foreground capitalize">{filter} revenue</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <h2 className="mb-1">{metrics.totalOrders}</h2>
          <p className="text-sm text-muted-foreground capitalize">Orders {filter}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
          <h2 className="text-red-600 mb-1">{formatCurrency(metrics.totalExpenses)}</h2>
          <p className="text-sm text-muted-foreground capitalize">{filter} costs</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
          <h2 className="text-green-600 mb-1">{formatCurrency(metrics.profitLoss)}</h2>
          <p className="text-sm text-muted-foreground capitalize">{filter} profit</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3>Top Selling Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Rank</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Item Name</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Units Sold</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(topItems?.items ?? []).map((item, index) => (
                <tr key={item.itemName} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.itemName}</td>
                  <td className="px-6 py-4 text-right">{item.unitsSold}</td>
                  <td className="px-6 py-4 text-right text-green-600">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-blue-900 mb-2">Report Summary</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p>• Average order value: {formatCurrency(metrics.totalOrders ? metrics.totalSales / metrics.totalOrders : 0)}</p>
            <p>• Profit margin: {Math.round(metrics.totalSales ? (metrics.profitLoss / metrics.totalSales) * 100 : 0)}%</p>
          </div>
          <div>
            <p>• Average orders per day: {filter === "daily" ? metrics.totalOrders : filter === "weekly" ? Math.round(metrics.totalOrders / 7) : Math.round(metrics.totalOrders / 30)}</p>
            <p>• Expense ratio: {Math.round(metrics.totalSales ? (metrics.totalExpenses / metrics.totalSales) * 100 : 0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
