import DodoPayments from "dodopayments";

let dodoInstance = null;

function getDodoApiKey() {
  return process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_SECRET_KEY || "";
}

function getDodoEnvironment() {
  const value = process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode";
  return value === "test_mode" ? "test_mode" : "live_mode";
}

function getDodo() {
  if (dodoInstance) return dodoInstance;

  const apiKey = getDodoApiKey();
  if (!apiKey) {
    throw new Error("Please define DODO_PAYMENTS_API_KEY or DODO_SECRET_KEY in .env");
  }

  dodoInstance = new DodoPayments({
    bearerToken: apiKey,
    environment: getDodoEnvironment(),
  });

  return dodoInstance;
}

export default getDodo;
