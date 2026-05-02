import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Minus, Trash2, ShoppingBag, MessageSquare, CheckCircle2 } from "lucide-react";
import { orderStore } from "../../orders/store/orderStore";
import { formatCurrency } from "../../../shared/lib/format";

export default function CartPage() {
  const [cartItems, setCartItems] = useState(orderStore.getOrder().items);
  const [specialInstructions, setSpecialInstructions] = useState(orderStore.getOrder().specialInstructions);
  const currentOrder = useMemo(() => orderStore.getOrder(), [cartItems, specialInstructions]);

  const updateQuantity = (menuItemId: string, delta: number) => {
    const existing = cartItems.find((item) => item.menuItemId === menuItemId);
    if (!existing) return;

    orderStore.updateQuantity(menuItemId, Math.max(0, existing.quantity + delta));
    setCartItems([...orderStore.getOrder().items]);
  };

  const removeItem = (menuItemId: string) => {
    orderStore.removeItem(menuItemId);
    setCartItems([...orderStore.getOrder().items]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  const handleProceedToCheckout = () => {
    orderStore.updateOrder({
      items: cartItems,
      specialInstructions,
      status: "pending"
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-white rounded-2xl p-12 border-2 border-[#E8DCC8] shadow-lg">
          <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-[#D4A574]" />
          <h2 className="mb-2 text-[#2C1810]">Your cart is empty</h2>
          <p className="text-[#6B5D52] mb-6">Add some delicious items to get started</p>
          <Link
            to="/menu"
            className="inline-block bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-[#2C1810]">Your Cart</h1>
        <p className="text-[#6B5D52] mt-1">{cartItems.length} items ready to order</p>
      </div>

      <div className="space-y-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.menuItemId} className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-5 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F4E8D8] to-[#E8DCC8] rounded-xl flex items-center justify-center text-4xl overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-[#2C1810]">{item.name}</h3>
                <p className="text-[#B85C3E] mb-3 text-lg">{formatCurrency(item.price)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-[#F4E8D8] rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4 text-[#2C1810]" />
                    </button>
                    <span className="w-8 text-center text-[#2C1810]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#2C1810]" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    className="text-[#C14953] hover:text-[#A03A42] p-2 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 mb-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-[#B85C3E]" />
          <h3 className="text-[#2C1810]">Special Instructions</h3>
        </div>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any special requests? (e.g., extra hot, less sugar, no ice...)"
          rows={3}
          className="w-full px-4 py-3 border-2 border-[#E8DCC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent resize-none bg-[#FBF8F3] text-[#2C1810] placeholder:text-[#6B5D52]"
        />
        {currentOrder.commentAcknowledged && (
          <div className="mt-3 flex items-center gap-2 bg-[#6B9B8F]/10 border border-[#6B9B8F]/30 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-[#6B9B8F]" />
            <p className="text-sm text-[#6B9B8F]">Kappio Café has acknowledged your request!</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 mb-6 shadow-md">
        <h3 className="mb-4 text-[#2C1810]">Bill Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-[#6B5D52]">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#6B5D52]">
            <span>Delivery Fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="border-t-2 border-[#E8DCC8] pt-3 flex justify-between">
            <span className="text-[#2C1810]">Total</span>
            <span className="text-[#B85C3E] text-xl">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <Link
        to="/checkout"
        onClick={handleProceedToCheckout}
        className="w-full bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-5 rounded-2xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg hover:scale-105"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
