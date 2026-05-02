import { Outlet, Link } from "react-router";
import { Truck, LogOut } from "lucide-react";
import { authStore } from "../../../shared/lib/auth";
import { logout as logoutRequest } from "../../auth/api/authApi";

export default function DeliveryLayout() {
  const session = authStore.getSession();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2>Delivery Partner</h2>
              <p className="text-sm text-muted-foreground">{session?.user.fullName ?? "Active"}</p>
            </div>
          </div>
          <Link
            to="/"
            onClick={() => {
              void logoutRequest();
            }}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
