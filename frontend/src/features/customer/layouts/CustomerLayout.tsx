import { Outlet, Link, useLocation } from "react-router";
import { Home, ShoppingCart, User, Coffee } from "lucide-react";

export default function CustomerLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/menu", icon: Home, label: "Menu" },
    { path: "/cart", icon: ShoppingCart, label: "Cart" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#FBF8F3]">
      <header className="bg-gradient-to-r from-[#2C1810] to-[#6B4423] px-4 py-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Coffee className="w-8 h-8 text-[#D4A574]" />
            <h2 className="text-[#FBF8F3] text-2xl">Kappio Café</h2>
          </div>
          <p className="text-sm text-[#D4A574]">Artisan coffee & delicious treats</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E8DCC8] shadow-2xl">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map((item) => {
            const isActive =
              item.path === "/menu"
                ? location.pathname === "/menu"
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center gap-1 py-4 transition-all duration-200 ${
                  isActive ? "text-[#B85C3E]" : "text-[#6B5D52]"
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
