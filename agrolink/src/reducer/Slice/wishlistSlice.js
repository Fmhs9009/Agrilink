import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

const initialState = {
  wishlist: localStorage.getItem("wishlist")
    ? JSON.parse(localStorage.getItem("wishlist"))
    : [],
  totalItems: localStorage.getItem("wishlistTotal")
    ? JSON.parse(localStorage.getItem("wishlistTotal"))
    : 0,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: initialState,
  reducers: {
    addToWishlist(state, action) {
      const product = action.payload;
      const existingProduct = state.wishlist.find((item) => item._id === product._id || item.id === product.id);
      
      if (existingProduct) {
        toast.error("Product already in wishlist");
        return;
      }
      
      state.wishlist.push(product);
      state.totalItems++;
      
      localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
      localStorage.setItem("wishlistTotal", JSON.stringify(state.totalItems));
      
      toast.success("Added to wishlist");
    },
    
    removeFromWishlist(state, action) {
      const id = action.payload;
      const existingProduct = state.wishlist.find((item) => item._id === id || item.id === id);
      
      if (!existingProduct) {
        toast.error("Product not found in wishlist");
        return;
      }
      
      state.wishlist = state.wishlist.filter((item) => (item._id !== id && item.id !== id));
      state.totalItems--;
      
      localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
      localStorage.setItem("wishlistTotal", JSON.stringify(state.totalItems));
      
      toast.success("Removed from wishlist");
    },
    
    clearWishlist(state) {
      state.wishlist = [];
      state.totalItems = 0;
      
      localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
      localStorage.setItem("wishlistTotal", JSON.stringify(state.totalItems));
      
      toast.success("Wishlist cleared");
    },
    
    moveToCart(state, action) {
      // This action will be handled by a thunk to coordinate between wishlist and cart
      // The actual implementation will be in a separate file
    }
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist, moveToCart } = wishlistSlice.actions;
export default wishlistSlice.reducer; 