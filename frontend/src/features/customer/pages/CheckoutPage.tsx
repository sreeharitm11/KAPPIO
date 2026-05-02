import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Wallet } from "lucide-react";
import { createOrder } from "../../orders/api/ordersApi";
import { orderStore } from "../../orders/store/orderStore";
import { authStore } from "../../../shared/lib/auth";
import { formatCurrency } from "../../../shared/lib/format";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [comments, setComments] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentOrder = orderStore.getOrder();
  const subtotal = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    const session = authStore.getSession();
    if (session?.user.role === "CUSTOMER" && session.user.fullName) {
      setCustomerName((prev) => prev || session.user.fullName);
    }
  }, []);

  const captureLocation = () => {
    setCapturingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const link = `https://mappls.com/?q=${lat},${lng}`;
          setLocationLink(link);
          setCapturingLocation(false);
        },
        (error) => {
          alert("Unable to capture location: " + error.message);
          setCapturingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setCapturingLocation(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address || !phone || currentOrder.items.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const session = authStore.getSession();
      const customerId =
        session?.user.role === "CUSTOMER" ? session.user.sub : undefined;

      const finalInstructions = [
        comments.trim(), 
        locationLink ? `Live Location: ${locationLink}` : ''
      ].filter(Boolean).join('\n\n');

      const order = await createOrder({
        ...(customerId ? { customerId } : {}),
        customerName: customerName || undefined,
        customerPhone: phone,
        deliveryAddress: address,
        specialInstructions: finalInstructions || undefined,
        items: currentOrder.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });

      orderStore.updateOrder({
        lastOrderNumber: order.orderNumber,
        status: order.status,
      });
      navigate(`/confirmation/${order.orderNumber}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[#2C1810]">Checkout</h1>
          <p className="text-[#6B5D52] mt-1">Complete your order</p>
        </div>
        <button
          onClick={captureLocation}
          disabled={capturingLocation}
          className="bg-[#6B9B8F] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#4A7C71] disabled:opacity-70 transition-colors flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {capturingLocation ? "Locating..." : "Use My Location"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 mb-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-[#B85C3E]" />
          <h3 className="text-[#2C1810]">Delivery Address</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-[#2C1810]">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Alice Brown"
              className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent bg-[#FBF8F3]"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[#2C1810]">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent bg-[#FBF8F3]"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[#2C1810]">Complete Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no., Street, Area, City"
              rows={2}
              className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent resize-none bg-[#FBF8F3]"
            />
          </div>
          {locationLink && (
            <div className="text-sm text-[#6B9B8F] bg-[#6B9B8F]/10 p-3 rounded-xl border border-[#6B9B8F]/30 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Location captured via Mappls! It will be shared with the delivery partner.</span>
            </div>
          )}
          <div>
            <label className="block text-sm mb-2 text-[#2C1810]">Cooking Instructions / Comments (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="E.g., Less spicy, leave at the door..."
              rows={2}
              className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent resize-none bg-[#FBF8F3]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 mb-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-[#B85C3E]" />
          <h3 className="text-[#2C1810]">Payment Method</h3>
        </div>
        <div className="space-y-3">
          <div className="w-full p-5 border-2 rounded-xl flex items-center gap-3 border-[#B85C3E] bg-[#B85C3E]/10">
            <Wallet className="w-6 h-6 text-[#B85C3E]" />
            <div className="text-left">
              <p className="text-[#2C1810]">Cash on Delivery</p>
              <p className="text-sm text-[#6B5D52]">Pay the delivery partner in cash at your doorstep</p>
            </div>
            <div className="ml-auto w-6 h-6 bg-[#B85C3E] rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#6B9B8F]/20 to-[#B85C3E]/20 border-2 border-[#D4A574] rounded-2xl p-5 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-[#2C1810]">Total Amount</span>
          <span className="text-[#B85C3E] text-xl">{formatCurrency(total)}</span>
        </div>
        <p className="text-sm text-[#6B5D52]">Includes all taxes and delivery charges</p>
      </div>

      <button
        onClick={() => void handlePlaceOrder()}
        disabled={submitting}
        className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-5 rounded-2xl hover:shadow-xl transition-all duration-300 text-lg hover:scale-105 disabled:opacity-70"
      >
        {submitting ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}
