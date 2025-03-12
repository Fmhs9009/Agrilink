import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

const initialState = {
  cart: localStorage.getItem("cart")
    ? JSON.parse(localStorage.getItem("cart"))
    : [],

  totalItems: localStorage.getItem("totalItems")
    ? JSON.parse(localStorage.getItem("totalItems"))
    : 0,

  totalAmount: localStorage.getItem("totalAmount")
    ? JSON.parse(localStorage.getItem("totalAmount"))
    : 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState: initialState,
  reducers: {
    addProduct(state, action) {
      const product = action.payload;
      const existingProduct = state.cart.find((item) => item._id === product._id);
      
      if (existingProduct) {
        toast.error("Product already in cart");
        return;
      }
      
      // Ensure product has quantity
      if (!product.quantity) {
        product.quantity = 1;
      }
      
      state.cart.push(product);
      state.totalItems += 1;
      state.totalAmount += product.price * product.quantity;

      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
    
    removeProduct(state, action) {
      const id = action.payload;
      const existingProduct = state.cart.find((item) => item._id === id || item.id === id);
      
      if (!existingProduct) {
        toast.error("Product not found");
        return;
      }
      
      state.totalItems -= 1;
      state.totalAmount -= existingProduct.price * (existingProduct.quantity || 1);
      state.cart = state.cart.filter((item) => item._id !== id && item.id !== id);
      
      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
    
    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      const product = state.cart.find((item) => item._id === id || item.id === id);
      
      if (!product) {
        toast.error("Product not found");
        return;
      }
      
      // Calculate price difference
      const oldQuantity = product.quantity || 1;
      const priceDifference = product.price * (quantity - oldQuantity);
      
      // Update product quantity
      product.quantity = quantity;
      
      // Update total amount
      state.totalAmount += priceDifference;
      
      // Update localStorage
      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
    
    clearCart(state) {
      state.cart = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      
      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
  },
});

export const { addProduct, removeProduct, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
