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

  // Store referral code in cart attributes
  async function storeReferralInCart(referralCode, discountCode) {
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attributes: {
            gachi_ref: referralCode,
            gachi_discount_code: discountCode,
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

      if (data.success && data.discountCode) {
        // Store referral info in cart attributes
        await storeReferralInCart(referralCode, data.discountCode);

        // Save to localStorage for persistence
        localStorage.setItem("gachi_ref", referralCode);
        localStorage.setItem("gachi_discount_code", data.discountCode);

        // Remove ref parameter from URL (optional)
        const url = new URL(window.location);
        url.searchParams.delete(REF_PARAM);
        window.history.replaceState({}, "", url);

        console.log("Referral applied:", data.discountCode);
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
      const storedRef = localStorage.getItem("gachi_ref");
      const storedDiscount = localStorage.getItem("gachi_discount_code");
      if (storedRef && storedDiscount) {
        storeReferralInCart(storedRef, storedDiscount);
      }
    };
  }
})();

