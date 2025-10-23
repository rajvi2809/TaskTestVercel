import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../lib/api";
import { addToCart } from "../store/slices/cartSlice";
import toast from "react-hot-toast";
import "./HomePage.css";

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);

  const debouncedFetchProducts = useCallback(
    debounce((term, isSearchFilter = false) => {
      fetchProducts(term, isSearchFilter);
    }, 300),
    [selectedCategory, currentPage, sortDirection]
  );

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts(null, true);
  }, [currentPage, selectedCategory, sortDirection]);

  useEffect(() => {
    const handleSearchUpdate = (event) => {
      const newSearchTerm = event.detail;
      setSearchTerm(newSearchTerm);
      setCurrentPage(1);
      debouncedFetchProducts(newSearchTerm, true);
    };

    window.addEventListener("searchUpdate", handleSearchUpdate);
    return () => {
      window.removeEventListener("searchUpdate", handleSearchUpdate);
    };
  }, [debouncedFetchProducts]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/products/categories");
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (
    customSearchTerm = null,
    isSearchFilter = false
  ) => {
    try {
      if (isSearchFilter) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      const search = customSearchTerm !== null ? customSearchTerm : searchTerm;
      const response = await api.get("/products", {
        params: {
          search,
          category: selectedCategory,
          sortDir: sortDirection,
          page: currentPage,
          limit: 10,
        },
      });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.pages);
      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      if (isSearchFilter) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const isInCart = (productId) => {
    return cartItems.some((item) => item.productId === productId);
  };

  const handleAddToCart = (product) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      navigate("/login");
      return;
    }

    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to E-Commerce Store</h1>
        <p>Browse our collection of quality products</p>
      </div>

      <div className="products-section">
        <div className="filters">
          <div className="filter-group">
            <h3>Filter by Category</h3>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h3>Sort by Price</h3>
            <select
              value={sortDirection}
              onChange={(e) => {
                setSortDirection(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="desc">Highest to Lowest</option>
              <option value="asc">Lowest to Highest</option>
            </select>
          </div>
        </div>

        <div className="products-list">
          <h2>Products ({products.length})</h2>

          {error && <div className="alert alert-error">{error}</div>}

          {searchLoading && <div className="search-loading">Searching...</div>}

          {products.length === 0 && !searchLoading ? (
            <div className="no-products">No products found</div>
          ) : (
            <div className={`grid ${searchLoading ? "loading" : ""}`}>
              {products.map((product) => (
                <div key={product._id} className="product-card card">
                  <div className="product-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="product-body card-body">
                    <h3>{product.name}</h3>
                    <p className="sku">SKU: {product.sku}</p>
                    <p className="category">{product.category}</p>
                    {product.description && (
                      <p className="description">{product.description}</p>
                    )}
                    <div className="price-section">
                      <span className="price">₹{product.price.toFixed(2)}</span>
                      <span
                        className={`stock ${
                          product.stock > 0 ? "in-stock" : "out-of-stock"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </span>
                    </div>
                    <button
                      className={`button ${
                        isInCart(product._id)
                          ? "button-secondary go-to-cart-btn"
                          : "button-primary add-to-cart-btn"
                      }`}
                      onClick={() =>
                        isInCart(product._id)
                          ? navigate("/cart")
                          : handleAddToCart(product)
                      }
                      disabled={product.stock === 0}
                    >
                      {isInCart(product._id) ? "Go to Cart" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="button"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
