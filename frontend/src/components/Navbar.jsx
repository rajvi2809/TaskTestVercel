import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Always use custom event for smooth SPA behavior
    if (location.pathname !== "/") {
      // Navigate to homepage first, then trigger search
      navigate("/");
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("searchUpdate", { detail: value })
        );
      }, 100);
    } else {
      // Dispatch custom event to update HomePage without navigation
      window.dispatchEvent(new CustomEvent("searchUpdate", { detail: value }));
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {user?.role === "admin" ? (
          <div className="navbar-logo">
            <span className="logo-icon">E</span>
            E-Commerce Admin
          </div>
        ) : (
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">E</span>
            E-Commerce
          </Link>
        )}

        {user?.role !== "admin" && (
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  if (location.pathname !== "/") {
                    navigate("/");
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent("searchUpdate", { detail: searchTerm })
                      );
                    }, 100);
                  }
                }
              }}
            />
          </div>
        )}

        <div className="navbar-menu">
          {user ? (
            user.role === "admin" ? (
              <>
                <span className="user-name">Admin: {user.name}</span>
                <Link to="/admin" className="nav-link">
                  Admin Panel
                </Link>
                <Link to="/reports" className="nav-link">
                  Reports
                </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <span className="user-name">Hello, {user.name}</span>
                <Link to="/" className="nav-link">
                  Home
                </Link>
                <Link to="/orders" className="nav-link">
                  My Orders
                </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </>
            )
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
          {user?.role !== "admin" && (
            <Link to="/cart" className="cart-link">
              Cart <span className="cart-count">{cartCount}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
