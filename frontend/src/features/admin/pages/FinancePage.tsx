import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchCashbook, fetchExpenses, fetchFinanceSummary } from "../../reports/api/reportsApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { CashbookEntry, Expense, FinanceSummary } from "../../../shared/types/api";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"direct" | "indirect" | "cashbook">("direct");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [directExpenses, setDirectExpenses] = useState<Expense[]>([]);
  const [indirectExpenses, setIndirectExpenses] = useState<Expense[]>([]);
  const [cashBook, setCashBook] = useState<CashbookEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, directData, indirectData, cashbookData] = await Promise.all([
          fetchFinanceSummary(),
          fetchExpenses("DIRECT"),
          fetchExpenses("INDIRECT"),
          fetchCashbook(),
        ]);
        setSummary(summaryData);
        setDirectExpenses(directData.items);
        setIndirectExpenses(indirectData.items);
        setCashBook(cashbookData.items);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load finance data");
      }
    };

    void load();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Finance Management</h1>
          <p className="text-muted-foreground mt-1">Track expenses and manage cash book</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Direct Expenses (Today)</p>
          <h2 className="text-red-600">{formatCurrency(summary?.directExpenses ?? 0)}</h2>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Indirect Expenses (This Month)</p>
          <h2 className="text-red-600">{formatCurrency(summary?.indirectExpenses ?? 0)}</h2>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Current Cash Balance</p>
          <h2 className="text-green-600">{formatCurrency(summary?.currentCashBalance ?? 0)}</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab("direct")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "direct"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Direct Expenses
            </button>
            <button
              onClick={() => setActiveTab("indirect")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "indirect"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Indirect Expenses
            </button>
            <button
              onClick={() => setActiveTab("cashbook")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "cashbook"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cash Book
            </button>
          </div>
        </div>

        {activeTab === "direct" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Description</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Category</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {directExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{expense.date}</td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "indirect" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Description</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Category</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {indirectExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{expense.date}</td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "cashbook" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Type</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Description</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Amount</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cashBook.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{entry.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          entry.type === "CREDIT"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{entry.description}</td>
                    <td className={`px-6 py-4 text-right ${
                      entry.type === "CREDIT" ? "text-green-600" : "text-red-600"
                    }`}>
                      {entry.type === "CREDIT" ? "+" : "-"}{formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(entry.balance)}</td>
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
