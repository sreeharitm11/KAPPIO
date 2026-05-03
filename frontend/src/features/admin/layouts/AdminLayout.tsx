import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, ShoppingCart, Menu, Package, DollarSign, FileText, LogOut, Coffee, Users, Building2, Bell } from "lucide-react";
import { authStore } from "../../../shared/lib/auth";
import { logout as logoutRequest } from "../../auth/api/authApi";
import { notificationsSocket } from "../../../shared/lib/realtime";

function OrderNotificationListener() {
  const [newOrder, setNewOrder] = useState<{ id: string; number: string } | null>(null);

  useEffect(() => {
    let socket: any;
    const setup = async () => {
      try {
        socket = await notificationsSocket.connect();
        socket.on("NEW_ORDER", (data: any) => {
          // Play notification sound
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
          audio.play().catch(() => console.log("Audio play blocked by browser"));
          
          setNewOrder({ id: data.orderId, number: data.orderNumber });
          setTimeout(() => setNewOrder(null), 10000); // Clear after 10s
        });
      } catch (e) {
        console.error("Socket failed", e);
      }
    };
    setup();
    return () => {
      socket?.off("NEW_ORDER");
      notificationsSocket.disconnect();
    };
  }, []);

  if (!newOrder) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-500">
      <Link 
        to="/admin/orders" 
        onClick={() => setNewOrder(null)}
        className="bg-[#2C1810] border-2 border-[#D4A574] p-5 rounded-2xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform"
      >
        <div className="w-12 h-12 bg-[#B85C3E] rounded-xl flex items-center justify-center animate-bounce">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-[#D4A574] text-xs font-bold uppercase tracking-widest">New Order Received!</p>
          <p className="text-white font-bold text-lg">Order #{newOrder.number}</p>
          <p className="text-[#FBF8F3]/60 text-[10px] mt-1">Click to view details</p>
        </div>
      </Link>
    </div>
  );
}

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
    { path: "/admin/vendors", icon: Building2, label: "Vendors" },
  ];

  return (
    <div className="flex h-screen bg-[#FBF8F3]">
      <OrderNotificationListener />
      <aside className="w-72 bg-gradient-to-b from-[#2C1810] to-[#6B4423] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#D4A574]/20">
          <div className="flex items-center gap-3 mb-2">
            <Coffee className="w-8 h-8 text-[#D4A574]" />
            <h2 className="text-[#FBF8F3] text-xl font-bold">Kappio Cafe®</h2>
          </div>
          <p className="text-xs text-[#D4A574] font-medium tracking-wide uppercase">{session?.user.fullName ?? "Administrator"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                    ? "bg-[#D4A574] text-[#2C1810] shadow-lg font-bold"
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
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#FBF8F3] hover:bg-red-900/30 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

