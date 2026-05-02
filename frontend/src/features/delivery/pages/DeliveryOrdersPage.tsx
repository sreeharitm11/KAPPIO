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
        <h1>Assigned Orders</h1>
        <p className="text-muted-foreground mt-1">{assignedOrders.length} deliveries pending</p>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Today's Deliveries</p>
          <h2 className="mb-1">{assignedOrders.length}</h2>
          <p className="text-sm text-green-600">Live assignment count</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Earnings Today</p>
          <h2 className="text-green-600 mb-1">
            {formatCurrency(
              assignedOrders
                .filter((entry) => entry.status === "DELIVERED")
                .reduce((sum, entry) => sum + Number(entry.order.deliveryFee), 0),
            )}
          </h2>
          <p className="text-sm text-muted-foreground">Based on delivered orders</p>
        </div>
      </div>

      <div className="space-y-4">
        {assignedOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50">
              <div>
                <h3>Order #{order.order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  {timeAgo(order.order.createdAt)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  order.status === "ASSIGNED"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {order.status === "ASSIGNED" ? "Ready for Pickup" : order.status.replace("_", " ")}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                <p>{order.order.customerName ?? "Walk-in Customer"}</p>
                <p className="text-sm text-muted-foreground">{order.order.customerPhone}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </p>
                <p className="text-sm">{order.order.deliveryAddress}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {order.order.items.length} items
                  </p>
                  <p className="text-green-600 mt-1">{formatCurrency(order.order.totalAmount)}</p>
                </div>
                <Link
                  to={`/deliverypartner/order/${order.order.id}`}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
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
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2">No orders assigned</h3>
          <p className="text-muted-foreground">Check back soon for new deliveries</p>
        </div>
      )}
    </div>
  );
}
