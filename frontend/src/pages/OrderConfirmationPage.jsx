import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import "./OrderConfirmationPage.css";

function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error("Error fetching order:", error);
      setError("Failed to load order details");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="error">
          <h1>Order Not Found</h1>
          <p>{error || "The order you're looking for doesn't exist."}</p>
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
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h1>Order Confirmed!</h1>
          <p>
            Thank you for your purchase. Your order has been placed
            successfully.
          </p>
        </div>

        <div className="order-details">
          <h2>Order Details</h2>
          <div className="order-info">
            <div className="info-row">
              <span className="label">Order Number:</span>
              <span className="value">#{order.id}</span>
            </div>
            <div className="info-row">
              <span className="label">Order Date:</span>
              <span className="value">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className="value status">{order.status}</span>
            </div>
            <div className="info-row">
              <span className="label">Total Amount:</span>
              <span className="value total">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="order-items">
          <h3>Items Ordered</h3>
          <div className="items-list">
            {order.items &&
              order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-details">
                    <h4>
                      {item.product?.name || `Product ID: ${item.productId}`}
                    </h4>
                    <p>SKU: {item.product?.sku || "N/A"}</p>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    <span className="unit-price">
                      ₹{item.priceAtPurchase.toFixed(2)} each
                    </span>
                    <span className="total-price">
                      ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="shipping-info">
          <h3>Shipping Information</h3>
          {order.shippingAddress ? (
            <div className="address">
              <p>
                <strong>{order.shippingAddress.fullName}</strong>
              </p>
              <p>{order.shippingAddress.email}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          ) : (
            <p>No shipping address available</p>
          )}
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${order.subtotal ? order.subtotal.toFixed(2) : "N/A"}</span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>${order.tax ? order.tax.toFixed(2) : "N/A"}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>${order.shipping ? order.shipping.toFixed(2) : "N/A"}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="actions">
          <button
            className="button button-primary"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
          <button
            className="button button-secondary"
            onClick={() => window.print()}
          >
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
