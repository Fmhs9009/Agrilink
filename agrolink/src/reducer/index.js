import { combineReducers } from "@reduxjs/toolkit";
import CartSlice from "./Slice/cartSlice";
import authSlice from "./Slice/authSlice";
import wishlistSlice from "./Slice/wishlistSlice";
import contractRequestsSlice from "./Slice/contractRequestsSlice";

const rootReducer = combineReducers({
  cart: CartSlice,
  auth: authSlice,
  wishlist: wishlistSlice,
  contractRequests: contractRequestsSlice
});

export default rootReducer;