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

  // Store Shopify discount code in cart attributes (fallback method)
  async function storeReferralDiscountInCart(shopifyDiscountCode, discountPercentage, discountType) {
    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attributes: {
            referral_shopify_discount_code: shopifyDiscountCode,
            referral_discount_percentage: discountPercentage.toString(),
            referral_discount_type: discountType,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart");
      }

      return true;
    } catch (error) {
      console.error("Error storing referral discount in cart:", error);
      return false;
    }
  }

  // Set cart metafields via backend API (preferred method)
  async function setCartMetafields(cartId, shopifyDiscountCode, discountPercentage, discountType) {
    try {
      const shopDomain = getShopDomain();
      const response = await fetch("/apps/gachi-rewards/api/set-cart-metafields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId,
          shopifyDiscountCode,
          discountPercentage,
          discountType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set cart metafields");
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error setting cart metafields:", error);
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
      // Get current cart ID first
      let cartId = null;
      try {
        const cartResponse = await fetch("/cart.js");
        const cart = await cartResponse.json();
        cartId = cart.token; // Shopify cart token/ID
      } catch (cartError) {
        console.warn("Could not get cart ID, will use cart attributes fallback:", cartError);
      }

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

      if (data.success && data.shopifyDiscountCode) {
        const discountPercentage = data.discountPercentage || "10.0";
        const discountType = data.discountType || "percentage";

        // Try to set cart metafields first (preferred method)
        let metafieldsSuccess = false;
        if (cartId) {
          metafieldsSuccess = await setCartMetafields(
            cartId,
            data.shopifyDiscountCode,
            discountPercentage,
            discountType
          );
        }

        // Phase 4: If METAFIELDS_ONLY_MODE is enabled, skip cart attributes
        // Otherwise, fallback to cart attributes for backward compatibility
        const useAttributesFallback = true; // Can be controlled via config if needed
        
        if (!metafieldsSuccess && useAttributesFallback) {
          console.log("Falling back to cart attributes");
          await storeReferralDiscountInCart(
            data.shopifyDiscountCode,
            discountPercentage,
            discountType
          );
        } else if (!metafieldsSuccess) {
          console.warn("Metafields failed and attributes fallback disabled. Discount may not apply.");
        }

        // Save to localStorage for persistence
        localStorage.setItem("referral_shopify_discount_code", data.shopifyDiscountCode);
        localStorage.setItem("referral_discount_percentage", discountPercentage);
        localStorage.setItem("referral_discount_type", discountType);

        // Remove ref parameter from URL
        const url = new URL(window.location);
        url.searchParams.delete(REF_PARAM);
        window.history.replaceState({}, "", url);

        console.log("Referral discount applied:", data.shopifyDiscountCode, metafieldsSuccess ? "(via metafields)" : "(via attributes)");
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
  // Try to set metafields first, then fallback to attributes
  if (window.Shopify && window.Shopify.cart) {
    window.Shopify.cart.onCartUpdate = async function () {
      const storedCode = localStorage.getItem("referral_shopify_discount_code");
      const storedPercentage = localStorage.getItem("referral_discount_percentage");
      const storedType = localStorage.getItem("referral_discount_type");
      
      if (storedCode && storedPercentage) {
        // Try to get cart ID and set metafields
        try {
          const cartResponse = await fetch("/cart.js");
          const cart = await cartResponse.json();
          const cartId = cart.token;
          
          if (cartId) {
            const metafieldsSuccess = await setCartMetafields(
              cartId,
              storedCode,
              storedPercentage,
              storedType || "percentage"
            );
            
            if (!metafieldsSuccess) {
              // Fallback to attributes
              await storeReferralDiscountInCart(storedCode, storedPercentage, storedType || "percentage");
            }
          } else {
            // No cart ID, use attributes
            await storeReferralDiscountInCart(storedCode, storedPercentage, storedType || "percentage");
          }
        } catch (error) {
          // Fallback to attributes on error
          await storeReferralDiscountInCart(storedCode, storedPercentage, storedType || "percentage");
        }
      }
    };
  }
})();

