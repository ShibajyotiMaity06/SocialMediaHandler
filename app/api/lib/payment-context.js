function readForwardedIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "";
  const first = forwarded.split(",")[0]?.trim() || "";
  return first;
}

export function getClientIp(request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-client-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    readForwardedIp(request) ||
    ""
  );
}

export function getCountryCode(request) {
  const code =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("cloudfront-viewer-country") ||
    request.headers.get("x-country-code") ||
    "";

  return code.toUpperCase();
}

export function resolvePaymentContext(request) {
  const countryCode = getCountryCode(request);
  const clientIp = getClientIp(request);
  const isIndia = countryCode === "IN";

  return {
    clientIp,
    countryCode,
    isIndia,
    recommendedCurrency: isIndia ? "INR" : "USD",
    recommendedProvider: isIndia ? "razorpay" : "dodo",
  };
}
