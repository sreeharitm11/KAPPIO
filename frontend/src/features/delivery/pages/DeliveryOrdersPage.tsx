import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Package, Clock, MapPin, ArrowRight } from "lucide-react";
import { fetchMyDeliveryOrders } from "../api/deliveryApi";
import { formatCurrency, timeAgo } from "../../../shared/lib/format";
import type { DeliveryAssignment } from "../../../shared/types/api";

export default function DeliveryOrdersPage() {
  const [assignedOrders, setAssignedOrders] = useState<DeliveryAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setAssignedOrders(await fetchMyDeliveryOrders());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load deliveries");
      }
    };

    void load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2C1810]">Assigned Orders</h1>
        <p className="text-[#6B5D52] mt-1">{assignedOrders.length} deliveries pending</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-[#E8DCC8] shadow-sm">
          <p className="text-sm text-[#6B5D52] mb-1">Today's Deliveries</p>
          <h2 className="text-3xl font-bold text-[#2C1810] mb-1">{assignedOrders.length}</h2>
          <p className="text-sm text-[#B85C3E]">Live assignment count</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[#E8DCC8] shadow-sm">
          <p className="text-sm text-[#6B5D52] mb-1">Earnings Today</p>
          <h2 className="text-3xl font-bold text-[#B85C3E] mb-1">
            {formatCurrency(
              assignedOrders
                .filter((entry) => entry.status === "DELIVERED")
                .reduce((sum, entry) => sum + Number(entry.order.deliveryFee), 0),
            )}
          </h2>
          <p className="text-sm text-[#6B5D52]">Based on delivered orders</p>
        </div>
      </div>

      <div className="space-y-4">
        {assignedOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-[#E8DCC8] shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-4 border-b border-[#E8DCC8] flex items-center justify-between bg-[#FBF8F3]">
              <div>
                <h3 className="text-lg font-bold text-[#2C1810]">Order #{order.order.orderNumber}</h3>
                <p className="text-sm text-[#6B5D52] flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-[#D4A574]" />
                  {timeAgo(order.order.createdAt)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  order.status === "ASSIGNED"
                    ? "bg-[#E8DCC8] text-[#6B4423]"
                    : "bg-[#D4A574] text-[#2C1810]"
                }`}
              >
                {order.status === "ASSIGNED" ? "Ready for Pickup" : order.status.replace("_", " ")}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider mb-1">Customer</p>
                <p className="text-[#2C1810] font-medium">{order.order.customerName ?? "Walk-in Customer"}</p>
                <p className="text-sm text-[#6B5D52]">{order.order.customerPhone}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Delivery Address
                </p>
                <p className="text-sm text-[#2C1810]">{order.order.deliveryAddress}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E8DCC8]">
                <div>
                  <p className="text-sm text-[#6B5D52]">
                    {order.order.items.length} items
                  </p>
                  <p className="font-bold text-[#B85C3E] mt-1">{formatCurrency(order.order.totalAmount)}</p>
                </div>
                <Link
                  to={`/deliverypartner/order/${order.order.id}`}
                  className="bg-[#B85C3E] text-[#FBF8F3] px-5 py-2.5 rounded-lg hover:bg-[#8A432D] transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {assignedOrders.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E8DCC8] p-12 text-center shadow-sm">
          <Package className="w-16 h-16 mx-auto mb-4 text-[#D4A574]/50" />
          <h3 className="text-xl font-bold text-[#2C1810] mb-2">No orders assigned</h3>
          <p className="text-[#6B5D52]">Check back soon for new deliveries</p>
        </div>
      )}
    </div>
  );
}
