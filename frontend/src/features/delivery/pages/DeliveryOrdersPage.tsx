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
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-[#B85C3E] via-[#D4A574] to-[#6B9B8F] text-white p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
        <div className="relative">
          <h1 className="mb-2 text-3xl">Assigned Orders</h1>
          <p className="opacity-90 text-lg">{assignedOrders.length} deliveries pending</p>
        </div>
      </div>
      
      <div className="px-4">
        {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border-2 border-[#E8DCC8] shadow-md hover:shadow-lg transition-all duration-300">
          <p className="text-sm font-semibold text-[#6B5D52] uppercase tracking-wider mb-2">Today's Deliveries</p>
          <h2 className="text-4xl font-bold text-[#2C1810] mb-1">{assignedOrders.length}</h2>
          <p className="text-sm font-medium text-[#B85C3E]">Live assignment count</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border-2 border-[#E8DCC8] shadow-md hover:shadow-lg transition-all duration-300">
          <p className="text-sm font-semibold text-[#6B5D52] uppercase tracking-wider mb-2">Earnings Today</p>
          <h2 className="text-4xl font-bold text-[#B85C3E] mb-1">
            {formatCurrency(
              assignedOrders
                .filter((entry) => entry.status === "DELIVERED")
                .reduce((sum, entry) => sum + Number(entry.order.deliveryFee), 0),
            )}
          </h2>
          <p className="text-sm text-[#6B5D52]">Based on delivered orders</p>
        </div>
      </div>

      <div className="space-y-6">
        {assignedOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
            <div className="p-5 flex items-center justify-between bg-[#FBF8F3] border-b-2 border-[#E8DCC8]">
              <div>
                <h3 className="text-lg font-bold text-[#2C1810]">Order #{order.order.orderNumber}</h3>
                <p className="text-sm text-[#6B5D52] flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-[#D4A574]" />
                  {timeAgo(order.order.createdAt)}
                </p>
              </div>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                  order.status === "ASSIGNED"
                    ? "bg-[#E8DCC8] text-[#6B4423]"
                    : "bg-[#D4A574] text-[#2C1810]"
                }`}
              >
                {order.status === "ASSIGNED" ? "Ready for Pickup" : order.status.replace("_", " ")}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider mb-1">Customer</p>
                <p className="text-lg text-[#2C1810] font-semibold">{order.order.customerName ?? "Walk-in Customer"}</p>
                <p className="text-sm font-medium text-[#6B5D52]">{order.order.customerPhone}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-[#D4A574] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Delivery Address
                </p>
                <p className="text-base text-[#2C1810]">{order.order.deliveryAddress}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-[#E8DCC8]">
                <div>
                  <p className="text-sm text-[#6B5D52]">
                    {order.order.items.length} items
                  </p>
                  <p className="font-bold text-xl text-[#B85C3E] mt-1">{formatCurrency(order.order.totalAmount)}</p>
                </div>
                <Link
                  to={`/deliverypartner/order/${order.order.id}`}
                  className="bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium hover:scale-105"
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
        <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-12 text-center shadow-md">
          <Package className="w-16 h-16 mx-auto mb-4 text-[#D4A574]/50" />
          <h3 className="text-xl font-bold text-[#2C1810] mb-2">No orders assigned</h3>
          <p className="text-[#6B5D52]">Check back soon for new deliveries</p>
        </div>
      )}
      </div>
    </div>
  );
}
