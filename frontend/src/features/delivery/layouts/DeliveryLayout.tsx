import { Outlet, Link } from "react-router";
import { Truck, LogOut, Coffee } from "lucide-react";
import { authStore } from "../../../shared/lib/auth";
import { logout as logoutRequest } from "../../auth/api/authApi";

export default function DeliveryLayout() {
  const session = authStore.getSession();

  return (
    <div className="flex flex-col h-screen bg-[#FBF8F3]">
      <header className="bg-gradient-to-r from-[#2C1810] to-[#6B4423] px-4 py-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Coffee className="w-8 h-8 text-[#D4A574]" />
              <h2 className="text-[#FBF8F3] text-2xl">Kappio Café</h2>
            </div>
            <p className="text-sm text-[#D4A574]">Delivery Partner • {session?.user.fullName ?? "Active"}</p>
          </div>
          <Link
            to="/"
            onClick={() => {
              void logoutRequest();
            }}
            className="text-[#D4A574] hover:text-[#FBF8F3] p-2 transition-colors duration-200 bg-[#3A2618]/50 hover:bg-[#3A2618] rounded-full"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-6">
        <Outlet />
      </main>
    </div>
  );
}
