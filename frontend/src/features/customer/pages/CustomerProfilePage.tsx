import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coffee, LogOut, User, Package } from "lucide-react";
import { authStore } from "../../../shared/lib/auth";
import { fetchMyOrders } from "../../orders/api/ordersApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { Order } from "../../../shared/types/api";
import { logout as logoutAuth } from "../../auth/api/authApi";

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const session = authStore.getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.role !== "CUSTOMER") return;

    const load = async () => {
      try {
        const res = await fetchMyOrders({ page: 1, limit: 15 });
        setOrders(res.items);
      } catch (e) {
        setOrdersError(e instanceof Error ? e.message : "Could not load orders");
      }
    };

    void load();
  }, [session?.user.sub, session?.user.role]);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-8 shadow-md mb-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#B85C3E]/15 flex items-center justify-center">
            <User className="w-8 h-8 text-[#B85C3E]" />
          </div>
          <div>
            <h1 className="text-2xl text-[#2C1810]">Your profile</h1>
            <p className="text-sm text-[#6B5D52]">Account &amp; order history</p>
          </div>
        </div>

        {session?.user.role === "CUSTOMER" ? (
          <>
            <dl className="space-y-4 mb-8">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B5D52]">Name</dt>
                <dd className="text-[#2C1810] mt-1">{session.user.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6B5D52]">Email</dt>
                <dd className="text-[#2C1810] mt-1">{session.user.email}</dd>
              </div>
            </dl>

            <div className="border-t border-[#E8DCC8] pt-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#B85C3E]" />
                <h2 className="text-lg text-[#2C1810]">Your orders</h2>
              </div>
              {ordersError && (
                <p className="text-sm text-red-600 mb-2">{ordersError}</p>
              )}
              {!ordersError && orders.length === 0 && (
                <p className="text-sm text-[#6B5D52]">No orders yet — start from the menu.</p>
              )}
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex justify-between items-start gap-3 p-4 rounded-xl bg-[#FBF8F3] border border-[#E8DCC8]"
                  >
                    <div>
                      <p className="font-medium text-[#2C1810]">{o.orderNumber}</p>
                      <p className="text-xs text-[#6B5D52]">
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-[#6B5D52] mt-1">{o.status}</p>
                    </div>
                    <span className="text-[#B85C3E] font-medium shrink-0">
                      {formatCurrency(o.totalAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                void logoutAuth().then(() => navigate("/menu"));
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#E8DCC8] text-[#2C1810] hover:bg-[#FBF8F3]"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-[#6B5D52] mb-6">Sign in to save your details and see past orders.</p>
            <Link
              to="/login?next=/profile"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white font-medium"
            >
              <Coffee className="w-5 h-5" />
              Sign in
            </Link>
            <p className="mt-4 text-sm text-[#6B5D52]">
              New here?{" "}
              <Link to="/signup" className="text-[#B85C3E] font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
