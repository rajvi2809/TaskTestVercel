import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../lib/api";
import { clearCart } from "../store/slices/cartSlice";
import toast from "react-hot-toast";
import "./CheckoutPage.css";

function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.1;
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await api.post("/orders", {
        items: orderItems,
      });

      toast.success("Order placed successfully!", {
        duration: 3000,
      });

      dispatch(clearCart());
      setOrderSuccess(true);
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return <div className="loading">Loading...</div>;
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="success-message">
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your purchase. Your order has been processed.</p>
          <button
            className="button button-primary"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-container">
        <div className="order-items">
          <h2>Order Summary</h2>
          {cartItems.map((item) => (
            <div key={item.id} className="checkout-item">
              <div className="item-info">
                <h4>{item.product.name}</h4>
                <p className="sku">SKU: {item.product.sku}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
              <div className="item-price">
                ₹{(item.product.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}

          <div className="totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax (10%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="checkout-form">
          <h2>Complete Your Order</h2>

          <form onSubmit={handleCheckout}>
            <p className="note">
              Click the button below to complete your order. Your cart will be
              processed and you'll see a confirmation message.
            </p>

            <button
              style={{ marginTop: "20px" }}
              type="submit"
              className="button button-primary confirm-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm Order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
