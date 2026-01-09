(function () {
  "use strict";

  // Configuration - Use App Proxy URL
  const APP_PROXY_PATH = "/apps/gachi-rewards/api/safe-link";
  const REF_PARAM = "ref";

  // Get shop domain from current URL
  function getShopDomain() {
    const hostname = window.location.hostname;
    return hostname;
  }

  // Get referral code from URL
  function getReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(REF_PARAM);
  }

  // Store one-time code in cart attributes for Discount Function
  async function storeReferralInCart(oneTimeCode, discountPercentage, discountType) {
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attributes: {
            gachi_one_time_code: oneTimeCode,
            gachi_discount_percentage: discountPercentage.toString(),
            gachi_discount_type: discountType,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart");
      }

      return true;
    } catch (error) {
      console.error("Error storing referral in cart:", error);
      return false;
    }
  }

  // Main function
  async function applyReferral() {
    const referralCode = getReferralCode();
    if (!referralCode) {
      return; // No referral code in URL
    }

    try {
      // Call App Proxy endpoint (no API keys exposed!)
      const shopDomain = getShopDomain();
      const proxyUrl = `${APP_PROXY_PATH}?referralCode=${encodeURIComponent(referralCode)}&shop=${encodeURIComponent(shopDomain)}`;
      
      const response = await fetch(proxyUrl, {
        method: "GET", // App Proxy can use GET
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.oneTimeCode) {
        // Store one-time code and discount info in cart attributes for Discount Function
        await storeReferralInCart(
          data.oneTimeCode,
          data.discountPercentage || "10.0",
          data.discountType || "percentage"
        );

        // Save to localStorage for persistence
        localStorage.setItem("gachi_one_time_code", data.oneTimeCode);
        localStorage.setItem("gachi_discount_percentage", data.discountPercentage || "10.0");
        localStorage.setItem("gachi_discount_type", data.discountType || "percentage");

        // Remove ref parameter from URL
        const url = new URL(window.location);
        url.searchParams.delete(REF_PARAM);
        window.history.replaceState({}, "", url);

        console.log("Referral applied:", data.oneTimeCode);
      }
    } catch (error) {
      console.error("Error applying referral:", error);
    }
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyReferral);
  } else {
    applyReferral();
  }

  // Also check localStorage on cart load
  if (window.Shopify && window.Shopify.cart) {
    window.Shopify.cart.onCartUpdate = function () {
      const storedCode = localStorage.getItem("gachi_one_time_code");
      const storedPercentage = localStorage.getItem("gachi_discount_percentage");
      const storedType = localStorage.getItem("gachi_discount_type");
      if (storedCode && storedPercentage) {
        storeReferralInCart(storedCode, storedPercentage, storedType || "percentage");
      }
    };
  }
})();

