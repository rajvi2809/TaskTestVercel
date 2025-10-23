import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api } from "../lib/api";
import Cookies from "js-cookie";
import { loginSuccess } from "../store/slices/authSlice";
import { fetchCart } from "../store/slices/cartSlice";
import "./AuthPages.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      Cookies.set("token", response.data.token || "", { expires: 7 });
      dispatch(
        loginSuccess({ user: response.data.user, token: response.data.token })
      );

      // Fetch cart after login
      dispatch(fetchCart());

      // Check if there's a redirect after login
      const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
      if (redirectAfterLogin) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectAfterLogin);
      } else {
        // Redirect admin users to admin panel, others to home
        console.log(response.data.user.role);
        if (response.data.user.role === "admin") {
          setTimeout(() => {
            navigate("/admin");
          }, 0);
        } else {
          console.log("User login");
          navigate("/");
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <p>Enter your email and password to access your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>

        <p className="tip">Tip: Use "admin@example.com" for admin access</p>

        <button
          type="submit"
          className="button button-primary"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="switch-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
