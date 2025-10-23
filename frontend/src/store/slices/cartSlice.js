import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../lib/api";
import { logout } from "./authSlice";

const initialState = {
  items: [],
  loading: false,
  error: null,
  stockWarning: null,
};

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/cart");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cart"
      );
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await api.post("/cart", { productId, quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add to cart"
      );
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/cart/items/${id}`, { quantity });
      return response.data;
    } catch (error) {
      const errorPayload = error.response?.data || {
        message: "Failed to update cart item",
      };
      return rejectWithValue(errorPayload);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/cart/items/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove from cart"
      );
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/cart");
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear cart"
      );
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartItems: (state) => {
      state.items = [];
      state.error = null;
      state.stockWarning = null;
    },
    setCartError: (state, action) => {
      if (!action.payload) {
        state.error = null;
        state.stockWarning = null;
        return;
      }

      if (typeof action.payload === "string") {
        state.error = action.payload;
        state.stockWarning = null;
        return;
      }

      if (typeof action.payload === "object") {
        const message =
          action.payload.message || "Failed to update cart item";
        const availableStock =
          typeof action.payload.availableStock === "number"
            ? action.payload.availableStock
            : null;
        const cartItemId =
          action.payload.cartItemId ?? action.payload.id ?? null;
        const normalizedId =
          typeof cartItemId === "string"
            ? parseInt(cartItemId, 10)
            : cartItemId;
        const warningId =
          typeof normalizedId === "number" && !Number.isNaN(normalizedId)
            ? normalizedId
            : cartItemId ?? null;

        state.error = message;
        state.stockWarning =
          availableStock !== null
            ? {
                id: warningId,
                availableStock,
                message,
              }
            : null;
        return;
      }

      state.error = "Failed to update cart item";
      state.stockWarning = null;
    },
    clearCartError: (state) => {
      state.error = null;
      state.stockWarning = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stockWarning = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.stockWarning = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.stockWarning = null;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stockWarning = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.stockWarning = null;
        const existingItemIndex = state.items.findIndex(
          (item) => item.productId === action.payload.cartItem.productId
        );
        if (existingItemIndex >= 0) {
          state.items[existingItemIndex] = action.payload.cartItem;
        } else {
          state.items.push(action.payload.cartItem);
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stockWarning = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.cartItem) {
          const index = state.items.findIndex(
            (item) => item.id === action.payload.cartItem.id
          );
          if (index >= 0) {
            const existingItem = state.items[index] || {};
            state.items[index] = {
              ...existingItem,
              ...action.payload.cartItem,
              product:
                action.payload.cartItem.product || existingItem.product || null,
            };
          }
        } else {
          state.items = state.items.filter(
            (item) => item.id !== parseInt(action.meta.arg.id)
          );
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update cart item";
        state.stockWarning =
          typeof action.payload?.availableStock === "number"
            ? action.payload.availableStock
            : null;
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear cart when user logs out
      .addCase(logout, (state) => {
        state.items = [];
        state.error = null;
      });
  },
});

export const { clearCartItems, setCartError, clearCartError } =
  cartSlice.actions;

export default cartSlice.reducer;
