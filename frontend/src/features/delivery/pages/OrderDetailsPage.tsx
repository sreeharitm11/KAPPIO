import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Phone, MapPin, Navigation, CheckCircle, Package, Printer } from "lucide-react";
import { fetchOrderById } from "../../orders/api/ordersApi";
import { collectCodPayment, updateDeliveryStatus } from "../api/deliveryApi";
import { formatCurrency } from "../../../shared/lib/format";
import type { Order } from "../../../shared/types/api";
import { printCustomerSaleBill } from "../../../shared/lib/thermal-receipt";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"ASSIGNED" | "PICKED_UP" | "DELIVERED">("ASSIGNED");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const load = async () => {
      try {
        const response = await fetchOrderById(orderId);
        setOrder(response);
        setStatus(response.deliveryStatus);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load order");
      }
    };

    void load();
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <h2>{error ?? "Order not found"}</h2>
        </div>
      </div>
    );
  }

  const handleCallCustomer = () => {
    window.location.href = `tel:${order.customerPhone}`;
  };

  const handleOpenMaps = () => {
    const encodedAddress = encodeURIComponent(order.deliveryAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  const handleMarkDelivered = async () => {
    if (!orderId) return;
    if (confirm("Mark this order as delivered and collect COD?")) {
      try {
        await updateDeliveryStatus(orderId, "DELIVERED");
        await collectCodPayment(orderId, Number(order.totalAmount));
        alert("Order marked as delivered and COD collected successfully!");
        navigate("/deliverypartner");
      } catch (actionError) {
        alert(actionError instanceof Error ? actionError.message : "Unable to complete delivery");
      }
    }
  };

  const handlePickup = async () => {
    if (!orderId) return;
    try {
      await updateDeliveryStatus(orderId, "PICKED_UP");
      setStatus("PICKED_UP");
    } catch (actionError) {
      alert(actionError instanceof Error ? actionError.message : "Unable to update delivery");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1>Order #{order.orderNumber}</h1>
        <p className="text-muted-foreground mt-1">Delivery details and navigation</p>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm mb-4 overflow-hidden">
        <div className="p-4 border-b border-border bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Order Status</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                status === "ASSIGNED"
                  ? "bg-green-100 text-green-700"
                  : status === "PICKED_UP"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status === "ASSIGNED" ? "Ready for Pickup" : status === "PICKED_UP" ? "In Transit" : "Delivered"}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
            <h3>{order.customerName ?? "Walk-in Customer"}</h3>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
            <div className="flex items-center justify-between">
              <p>{order.customerPhone}</p>
              <button
                onClick={handleCallCustomer}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </p>
            <p className="mb-3">{order.deliveryAddress}</p>
            <button
              onClick={handleOpenMaps}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Navigate to Customer
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm mb-4 p-4">
        <h3 className="mb-3">Order Items</h3>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
              <span>
                {item.quantity}x {item.menuItem.name}
              </span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <span>Total Amount</span>
            <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg border border-border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Delivery Status</p>
            <p>{status.replace("_", " ")}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Delivery Fee</p>
            <p className="text-green-600">{formatCurrency(order.deliveryFee)}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => printCustomerSaleBill(order)}
        className="w-full bg-white border-2 border-orange-200 text-orange-900 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 mb-3"
      >
        <Printer className="w-5 h-5" />
        Print customer bill (58mm)
      </button>

      {status === "ASSIGNED" && (
        <button
          onClick={() => void handlePickup()}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <Package className="w-5 h-5" />
          Mark as Picked Up
        </button>
      )}

      {status === "PICKED_UP" && (
        <button
          onClick={() => void handleMarkDelivered()}
          className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Mark as Delivered
        </button>
      )}
    </div>
  );
}
