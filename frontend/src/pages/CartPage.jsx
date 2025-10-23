import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../store/slices/cartSlice";
import toast from "react-hot-toast";
import "./CartPage.css";

function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    items: cartItems,
    loading,
    error,
    stockWarning,
  } = useSelector((state) => state.cart);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleUpdateQuantity = (cartItemId, newQuantity) => {
    const parsedQuantity = Number.isFinite(Number(newQuantity))
      ? Number(newQuantity)
      : 1;

    dispatch(
      updateCartItem({ id: cartItemId, quantity: Math.max(1, parsedQuantity) })
    );
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeFromCart(cartItemId));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item?.product?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return total + price * quantity;
    }, 0);
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.1; // 10% tax
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h1>Shopping Cart</h1>
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/" className="button button-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="cart-container">
        <div className="cart-items">
          {cartItems.map((item) => {
            const price = Number(item?.product?.price) || 0;
            const quantity = Number(item?.quantity) || 0;
            const availableStock =
              item?.product && typeof item.product.stock === "number"
                ? item.product.stock
                : null;
            const limitReached =
              availableStock !== null && quantity >= availableStock;
            const warningForItem =
              stockWarning &&
              (stockWarning.id === item.id ||
                stockWarning.id === item.productId)
                ? stockWarning
                : null;

            return (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  {item?.product?.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name || "Product"}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="item-details">
                  <h3>{item?.product?.name || "Product"}</h3>
                  <p className="sku">SKU: {item?.product?.sku || "N/A"}</p>
                  <p className="price">₹{price.toFixed(2)}</p>
                  {availableStock !== null && (
                    <p
                      className={`stock-info $
                        {availableStock > 0 ? "in-stock" : "out-of-stock"}
                      `}
                    >
                      {availableStock > 0
                        ? `${availableStock} in stock`
                        : "Out of stock"}
                    </p>
                  )}
                </div>
                <div className="item-quantity">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                    disabled={loading}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(
                        item.id,
                        Number.isNaN(parseInt(e.target.value, 10))
                          ? quantity
                          : parseInt(e.target.value, 10)
                      )
                    }
                    min="1"
                    max={
                      availableStock !== null && availableStock > 0
                        ? availableStock
                        : undefined
                    }
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                    disabled={loading || limitReached}
                  >
                    +
                  </button>
                </div>
                {warningForItem && (
                  <div className="stock-warning">
                    {warningForItem.message}
                    {typeof warningForItem.availableStock === "number" &&
                      warningForItem.availableStock >= 0 &&
                      ` (Remaining: ${warningForItem.availableStock})`}
                  </div>
                )}
                <div className="item-total">
                  ₹{(price * quantity).toFixed(2)}
                </div>
                <button
                  style={{ padding: "none" }}
                  className="button button-danger remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (10%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button
            className="button button-primary checkout-btn"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
          <Link to="/" className="button button-secondary continue-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
