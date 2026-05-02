import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, ShoppingCart, Menu, Package, DollarSign, FileText, LogOut, Coffee, Users } from "lucide-react";
import { authStore } from "../../../shared/lib/auth";
import { logout as logoutRequest } from "../../auth/api/authApi";

export default function AdminLayout() {
  const location = useLocation();
  const session = authStore.getSession();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { path: "/admin/menu", icon: Menu, label: "Menu" },
    { path: "/admin/inventory", icon: Package, label: "Inventory" },
    { path: "/admin/team", icon: Users, label: "Team" },
    { path: "/admin/finance", icon: DollarSign, label: "Finance" },
    { path: "/admin/reports", icon: FileText, label: "Reports" },
  ];

  return (
    <div className="flex h-screen bg-[#FBF8F3]">
      <aside className="w-72 bg-gradient-to-b from-[#2C1810] to-[#6B4423] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#D4A574]/20">
          <div className="flex items-center gap-3 mb-2">
            <Coffee className="w-8 h-8 text-[#D4A574]" />
            <h2 className="text-[#FBF8F3] text-xl">Kappio Café</h2>
          </div>
          <p className="text-sm text-[#D4A574]">{session?.user.fullName ?? "Admin Dashboard"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#D4A574] text-[#2C1810] shadow-lg"
                    : "text-[#FBF8F3] hover:bg-[#3A2618]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#D4A574]/20">
          <Link
            to="/"
            onClick={() => {
              void logoutRequest();
            }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#FBF8F3] hover:bg-[#3A2618] transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Exit Admin</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
