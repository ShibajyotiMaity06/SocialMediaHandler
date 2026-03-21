import Razorpay from "razorpay";

let razorpayInstance = null;

function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }

  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return razorpayInstance;
}

export default getRazorpay;
