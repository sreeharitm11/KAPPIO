import { useEffect, useState } from "react";
import { Download, FileText, Calendar } from "lucide-react";
import { exportReport, fetchDashboard, fetchTopItems } from "../../reports/api/reportsApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { DashboardResponse, TopItemsResponse } from "../../../shared/types/api";

export default function ReportsPage() {
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [anchorDate, setAnchorDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [topItems, setTopItems] = useState<TopItemsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const query: any = { period: filter };
        if (filter === "custom") {
          query.startDate = startDate;
          query.endDate = endDate;
        } else {
          query.anchorDate = anchorDate;
        }

        const [dashboardData, topItemsData] = await Promise.all([
          fetchDashboard(query.period, query.anchorDate, query.startDate, query.endDate),
          fetchTopItems(query.period, query.anchorDate, query.startDate, query.endDate),
        ]);
        setDashboard(dashboardData);
        setTopItems(topItemsData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load reports");
      }
    };

    void load();
  }, [filter, anchorDate, startDate, endDate]);

  const exportToCSV = async () => {
    try {
      const file = await exportReport(filter, anchorDate, startDate, endDate);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kappio-report-${filter}-${anchorDate}.csv`;
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
          <h1 className="text-3xl font-black text-[#2C1810]">Reports & Analytics</h1>
          <p className="text-[#6B5D52] mt-1 font-medium">Detailed business performance and compliance reporting</p>
          {error && <p className="text-red-600 mt-2 font-bold">{error}</p>}
        </div>
        <button
          onClick={() => void exportToCSV()}
          className="bg-[#2C1810] text-white px-6 py-3 rounded-xl hover:bg-[#B85C3E] transition-all shadow-lg flex items-center gap-2 font-bold"
        >
          <Download className="w-5 h-5" />
          Export CSV Register
        </button>
      </div>

      <div className="bg-white rounded-3xl border-2 border-[#E8DCC8] shadow-xl mb-8 overflow-hidden">
        <div className="p-6 border-b border-[#E8DCC8] bg-[#FBF8F3]/50">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#6B4423]" />
            <h3 className="text-[#2C1810] font-bold">Filter Business Data</h3>
          </div>
        </div>
        <div className="p-8">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex gap-2 p-1.5 bg-[#FBF8F3] rounded-2xl border-2 border-[#E8DCC8]">
              {(["daily", "weekly", "monthly", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={`px-6 py-2.5 rounded-xl transition-all capitalize font-bold text-sm ${
                    filter === p
                      ? "bg-[#D4A574] text-[#2C1810] shadow-md"
                      : "text-[#6B5D52] hover:text-[#2C1810]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {filter !== "custom" ? (
              <div className="flex items-center gap-4 border-l-2 pl-8 border-[#E8DCC8]">
                <span className="text-sm font-bold text-[#6B5D52] uppercase tracking-widest">Reference Date:</span>
                <input
                  type="date"
                  value={anchorDate}
                  onChange={(e) => setAnchorDate(e.target.value)}
                  className="px-5 py-2.5 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:border-[#D4A574] font-bold text-[#2C1810]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l-2 pl-8 border-[#E8DCC8]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#6B5D52] uppercase tracking-widest">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:border-[#D4A574] font-bold text-xs"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#6B5D52] uppercase tracking-widest">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 bg-[#FBF8F3] border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:border-[#D4A574] font-bold text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DCC8] shadow-xl hover:scale-[1.02] transition-all">
          <p className="text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-1">Total Sales</p>
          <h2 className="text-3xl font-black text-[#B85C3E] mb-1">{formatCurrency(metrics.totalSales)}</h2>
          <p className="text-[10px] text-[#9E8E81] uppercase font-bold tracking-tighter">{filter} revenue</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DCC8] shadow-xl hover:scale-[1.02] transition-all">
          <p className="text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-1">Total Orders</p>
          <h2 className="text-3xl font-black text-[#2C1810] mb-1">{metrics.totalOrders}</h2>
          <p className="text-[10px] text-[#9E8E81] uppercase font-bold tracking-tighter">Orders {filter}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DCC8] shadow-xl hover:scale-[1.02] transition-all border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Total Expenses</p>
          <h2 className="text-3xl font-black text-red-600 mb-1">{formatCurrency(metrics.totalExpenses)}</h2>
          <p className="text-[10px] text-red-400 uppercase font-bold tracking-tighter">{filter} costs</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DCC8] shadow-xl hover:scale-[1.02] transition-all border-green-100">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Net Profit</p>
          <h2 className="text-3xl font-black text-green-600 mb-1">{formatCurrency(metrics.profitLoss)}</h2>
          <p className="text-[10px] text-green-400 uppercase font-bold tracking-tighter">{filter} profit</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-[#E8DCC8] shadow-xl overflow-hidden mb-8">
        <div className="p-6 border-b border-[#E8DCC8] bg-[#FBF8F3]/50 flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#6B4423]" />
          <h3 className="text-[#2C1810] font-bold">Top Selling Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FBF8F3] border-b border-[#E8DCC8]">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-[#6B5D52] uppercase tracking-widest">Rank</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-[#6B5D52] uppercase tracking-widest">Item Name</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-[#6B5D52] uppercase tracking-widest">Units Sold</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-[#6B5D52] uppercase tracking-widest">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]">
              {(topItems?.items ?? []).map((item, index) => (
                <tr key={item.itemName} className="hover:bg-[#FBF8F3]/40 transition-colors">
                  <td className="px-8 py-5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                          : index === 1
                          ? "bg-gray-100 text-gray-700 border-2 border-gray-200"
                          : "bg-orange-100 text-orange-700 border-2 border-orange-200"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-[#2C1810]">{item.itemName}</td>
                  <td className="px-8 py-5 text-right font-bold text-[#6B5D52]">{item.unitsSold}</td>
                  <td className="px-8 py-5 text-right font-black text-[#B85C3E]">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(topItems?.items ?? []).length === 0 && (
            <div className="p-16 text-center text-[#9E8E81] font-bold uppercase tracking-widest text-sm">
              No data available for this period
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#2C1810] rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Coffee className="w-48 h-48" />
        </div>
        <h4 className="text-[#D4A574] text-xs font-bold uppercase tracking-[0.3em] mb-6">Automated Business Summary</h4>
        <div className="grid md:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-[#FBF8F3]/60 font-medium">Average Order Value</span>
              <span className="text-xl font-bold">{formatCurrency(metrics.totalOrders ? metrics.totalSales / metrics.totalOrders : 0)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-[#FBF8F3]/60 font-medium">Net Profit Margin</span>
              <span className={`text-xl font-bold ${metrics.profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                {Math.round(metrics.totalSales ? (metrics.profitLoss / metrics.totalSales) * 100 : 0)}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-[#FBF8F3]/60 font-medium">Orders Intensity</span>
              <span className="text-xl font-bold">
                {filter === "daily" ? metrics.totalOrders : filter === "weekly" ? Math.round(metrics.totalOrders / 7) : Math.round(metrics.totalOrders / 30)} 
                <span className="text-xs ml-1 opacity-60">/ day</span>
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-[#FBF8F3]/60 font-medium">Operational Expense Ratio</span>
              <span className="text-xl font-bold text-red-300">
                {Math.round(metrics.totalSales ? (metrics.totalExpenses / metrics.totalSales) * 100 : 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
