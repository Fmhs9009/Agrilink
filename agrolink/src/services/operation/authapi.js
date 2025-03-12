import apiconnector from "../apiconnector";
import { catagories } from "../apis";
import toast from "react-hot-toast";

export function sendOtp(email, navigate) {
    console.log("email",email);
    return async (dispatch) => {
      try {
        const response = await apiconnector("POST", catagories.SENDOTP_API, {
          email,
          checkUserPresent: true,
        });
  
        console.log("otp", response.data);
        console.log("SENDOTP API RESPONSE............", response);
  
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
  
        toast.success("OTP Sent Successfully");
        // navigate("/verifyotp");
        return response.data;
      } catch (error) {
        console.log("SENDOTP API ERROR............", error);
        toast.error("Could Not Send OTP");
      }
    };
  }