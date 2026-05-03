import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Wallet, AlertTriangle } from "lucide-react";
import { createOrder } from "../../orders/api/ordersApi";
import { orderStore } from "../../orders/store/orderStore";
import { authStore } from "../../../shared/lib/auth";
import { formatCurrency } from "../../../shared/lib/format";
import { sendOtp, verifyOtp } from "../../auth/api/verificationApi";
import { fetchMyOrders } from "../../orders/api/ordersApi";
import MapplsMap from "../../../shared/components/MapplsMap";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [comments, setComments] = useState("");
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("UPI");
  const [isFirstOrder, setIsFirstOrder] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const currentOrder = orderStore.getOrder();
  const subtotal = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  const SHOP_LAT = 13.0854;
  const SHOP_LNG = 77.4329;

  useEffect(() => {
    const session = authStore.getSession();
    if (session?.user.role === "CUSTOMER") {
      if (session.user.fullName) setCustomerName((prev) => prev || session.user.fullName);
      if (session.user.email) setEmail((prev) => prev || session.user.email);
      
      // Check if first order
      fetchMyOrders({ limit: 1 })
        .then((res) => {
          setIsFirstOrder(res.meta.total === 0);
          if (res.meta.total === 0) setPaymentMethod("UPI");
          else setPaymentMethod("COD");
        })
        .catch(console.error);
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    
    // @ts-ignore
    if (window.mappls) {
      setCapturingLocation(true);
      // @ts-ignore
      window.mappls.getDistance({
        coordinates: `${SHOP_LAT},${SHOP_LNG};${lat},${lng}`
      }, (data: any) => {
        if (data && data.results && data.results.distances) {
          const distKm = data.results.distances[0][1] / 1000;
          setDistance(distKm);
          
          // Tiered fee logic
          if (distKm <= 3) setDeliveryFee(0);
          else if (distKm <= 5) setDeliveryFee(20);
          else if (distKm <= 8) setDeliveryFee(30);
          else if (distKm <= 12) setDeliveryFee(50);
          else {
            setDeliveryFee(0);
          }
        }
        setCapturingLocation(false);
      });
    }
  };

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      setCapturingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationSelect(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          alert("Unable to capture location: " + error.message);
          setCapturingLocation(false);
        }
      );
    }
  };

  const handleRequestOtp = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address for verification");
      return;
    }
    setCapturingLocation(true); // Reusing loading state
    try {
      await sendOtp(email);
      setShowOtpModal(true);
    } catch (err) {
      alert("Failed to send OTP. Please check your email address and try again.");
    } finally {
      setCapturingLocation(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setVerifyingOtp(true);
    try {
      const res = await verifyOtp(email, otp);
      if (res.verified) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        handlePlaceOrder();
      } else {
        alert(res.message || "Invalid OTP");
      }
    } catch (err) {
      alert("Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address || !phone || currentOrder.items.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    if (!isPhoneVerified) {
      handleRequestOtp();
      return;
    }

    setSubmitting(true);
    try {
      const session = authStore.getSession();
      const customerId =
        session?.user.role === "CUSTOMER" ? session.user.sub : undefined;

      const finalInstructions = [
        comments.trim(), 
        coords ? `Location: ${coords.lat},${coords.lng}` : ''
      ].filter(Boolean).join('\n\n');

      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order = await createOrder({
        ...(customerId ? { customerId } : {}),
        customerName: customerName || undefined,
        customerPhone: phone,
        deliveryAddress: address,
        tableNumber: currentOrder.tableNumber || undefined,
        specialInstructions: finalInstructions || undefined,
        items: currentOrder.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        latitude: coords?.lat,
        longitude: coords?.lng,
        deliveryDistance: distance || undefined,
        idempotencyKey,
      });

      if (paymentMethod === "UPI") {
        const vpa = "Q06322913@ybl"; // Shop VPA
        const upiUrl = `upi://pay?pa=${vpa}&pn=Kappio%20Cafe&am=${total}&cu=INR&tn=Order%20${order.orderNumber}`;
        
        // Try intent link
        window.location.href = upiUrl;
        
        // Navigate after short delay to allow intent to trigger
        setTimeout(() => {
          orderStore.updateOrder({
            lastOrderNumber: order.orderNumber,
            status: order.status,
          });
          orderStore.reset();
          navigate(`/confirmation/${order.orderNumber}?showQr=true`);
        }, 1500);
      } else {
        orderStore.reset();
        navigate(`/confirmation/${order.orderNumber}`);
      }
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
            <label className="block text-sm mb-2 text-[#2C1810]">Email Address (for verification)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
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
              className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent resize-none bg-[#FBF8F3] mb-4"
            />
            
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#6B5D52] uppercase tracking-wider">Pin exact delivery location</p>
              <div className="h-[250px] relative">
                <MapplsMap 
                  center={coords || { lat: SHOP_LAT, lng: SHOP_LNG }} 
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>
          </div>
          {distance !== null && (
            <div className="bg-gradient-to-br from-[#6B9B8F]/10 to-[#F4E8D8] p-5 rounded-2xl border-2 border-[#6B9B8F]/20 shadow-inner overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#6B9B8F]/10 rounded-full -mr-8 -mt-8" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#2C1810]">
                    <MapPin className="w-5 h-5 text-[#6B9B8F]" />
                    <span className="font-bold">Delivery Distance</span>
                  </div>
                  <span className="text-lg font-black text-[#6B9B8F]">{distance.toFixed(2)} km</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#6B9B8F]/20">
                  <div className="flex items-center gap-2 text-[#2C1810]">
                    <Wallet className="w-5 h-5 text-[#B85C3E]" />
                    <span className="font-bold">Estimated Fee</span>
                  </div>
                  <span className={`text-lg font-black ${deliveryFee === 0 ? "text-green-600" : "text-[#B85C3E]"}`}>
                    {deliveryFee > 0 ? formatCurrency(deliveryFee) : "FREE"}
                  </span>
                </div>
                {distance > 12 && (
                  <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-red-600 font-bold text-xs">Outside delivery range (max 12km)</p>
                  </div>
                )}
              </div>
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
          <button
            onClick={() => setPaymentMethod("UPI")}
            className={`w-full p-5 border-2 rounded-xl flex items-center gap-3 transition-all ${
              paymentMethod === "UPI" ? "border-[#B85C3E] bg-[#B85C3E]/5" : "border-[#E8DCC8]"
            }`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === "UPI" ? "border-[#B85C3E]" : "border-[#E8DCC8]"
            }`}>
              {paymentMethod === "UPI" && <div className="w-3 h-3 bg-[#B85C3E] rounded-full" />}
            </div>
            <div className="text-left">
              <p className="text-[#2C1810] font-medium">Pay via UPI</p>
              <p className="text-sm text-[#6B5D52]">Google Pay, PhonePe, Paytm</p>
            </div>
          </button>

          <button
            disabled={isFirstOrder}
            onClick={() => setPaymentMethod("COD")}
            className={`w-full p-5 border-2 rounded-xl flex items-center gap-3 transition-all ${
              paymentMethod === "COD" ? "border-[#B85C3E] bg-[#B85C3E]/5" : "border-[#E8DCC8]"
            } ${isFirstOrder ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === "COD" ? "border-[#B85C3E]" : "border-[#E8DCC8]"
            }`}>
              {paymentMethod === "COD" && <div className="w-3 h-3 bg-[#B85C3E] rounded-full" />}
            </div>
            <div className="text-left">
              <p className="text-[#2C1810] font-medium">Cash on Delivery</p>
              <p className="text-sm text-[#6B5D52]">Pay when order arrives</p>
              {isFirstOrder && <p className="text-xs text-orange-600 font-bold mt-1">Available from 2nd order</p>}
            </div>
          </button>
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
        className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-5 rounded-2xl hover:shadow-xl transition-all duration-300 text-lg hover:scale-[1.02] disabled:opacity-70 font-bold"
      >
        {submitting ? "Processing..." : paymentMethod === "UPI" ? "Pay & Place Order" : "Place Order"}
      </button>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-[#2C1810] mb-2">Verify Email</h2>
            <p className="text-[#6B5D52] text-sm mb-6">We've sent a 6-digit code to <span className="font-bold">{email}</span></p>
            
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] border-2 border-[#E8DCC8] rounded-xl mb-6 focus:ring-2 focus:ring-[#D4A574] outline-none font-bold"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-4 rounded-xl border-2 border-[#E8DCC8] font-bold text-[#6B5D52]"
              >
                Cancel
              </button>
              <button
                disabled={otp.length < 6 || verifyingOtp}
                onClick={handleVerifyOtp}
                className="flex-1 py-4 rounded-xl bg-[#2C1810] text-white font-bold disabled:opacity-50"
              >
                {verifyingOtp ? "Checking..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
