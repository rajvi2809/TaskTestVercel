import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import "./OrdersPage.css";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/my-orders");
      setOrders(response.data.orders || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "#f39c12";
      case "processing":
        return "#3498db";
      case "shipped":
        return "#9b59b6";
      case "delivered":
      case "completed":
        return "#2ecc71";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hrs ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track and view all your orders</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">
          <h3>No Orders Yet</h3>
          <p>
            You haven't placed any orders yet. Start shopping to see your orders
            here!
          </p>
          <a href="/" className="button button-primary">
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <div className="order-id">Order #{order.id}</div>
                  <div className="order-dates">
                    <span className="order-date-primary">
                      {formatDate(order.createdAt)}
                    </span>
                    {order.createdAt && (
                      <span className="order-date-relative">
                        {formatRelativeTime(order.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="order-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {(order.status || "").toUpperCase() || "N/A"}
                  </span>
                  <span className="order-total">
                    ₹{parseFloat(order.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="order-items">
                  <div className="order-items-header">
                    <h4>Items ({order.items.length})</h4>
                    <span className="order-source">
                      User ID: {order.userId || "Unknown"}
                    </span>
                  </div>
                  <div className="items-list">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-details">
                          <span className="item-name">
                            {item.product?.name ||
                              `Product ID: ${item.productId}`}
                          </span>
                          <span className="item-meta">
                            SKU: {item.product?.sku || "N/A"} • Qty:{" "}
                            {item.quantity}
                          </span>
                        </div>
                        <div className="item-price-group">
                          <span className="item-price-unit">
                            ₹{parseFloat(item.priceAtPurchase || 0).toFixed(2)}{" "}
                            each
                          </span>
                          <span className="item-price-total">
                            ₹
                            {(
                              (parseFloat(item.priceAtPurchase || 0) || 0) *
                              (item.quantity || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
