import DodoPayments from "dodopayments";

let dodoInstance = null;

function getDodoEnvironment() {
  const value = process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode";
  return value === "test_mode" ? "test_mode" : "live_mode";
}

function getDodo() {
  if (dodoInstance) return dodoInstance;

  if (!process.env.DODO_PAYMENTS_API_KEY) {
    throw new Error("Please define DODO_PAYMENTS_API_KEY in .env");
  }

  dodoInstance = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: getDodoEnvironment(),
  });

  return dodoInstance;
}

export default getDodo;
