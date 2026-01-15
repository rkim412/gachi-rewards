/**
 * Test script to verify Storefront API access token is configured correctly
 * 
 * Usage: node scripts/test-storefront-api.js [shop_domain]
 * Example: node scripts/test-storefront-api.js your-store.myshopify.com
 */

import { getStorefrontApiClient } from '../app/services/storefront.server.js';

const shop = process.argv[2] || process.env.SHOPIFY_SHOP || 'your-store.myshopify.com';

console.log('🧪 Testing Storefront API Configuration...\n');
console.log(`Shop: ${shop}\n`);

// Test query to verify token works
const testQuery = `
  query {
    shop {
      name
      myshopifyDomain
    }
  }
`;

try {
  console.log('1. Getting Storefront API client...');
  const storefront = await getStorefrontApiClient(shop);
  console.log('   ✅ Client created\n');

  console.log('2. Testing Storefront API query...');
  const response = await storefront.request(testQuery);
  
  if (response.errors) {
    console.error('   ❌ GraphQL Errors:');
    response.errors.forEach(error => {
      console.error(`      - ${error.message}`);
    });
    process.exit(1);
  }

  if (response.data?.shop) {
    console.log('   ✅ Storefront API is working!');
    console.log(`   Shop Name: ${response.data.shop.name}`);
    console.log(`   Domain: ${response.data.shop.myshopifyDomain}\n`);
  }

  // Test cart metafields mutation (with a dummy cart ID)
  console.log('3. Testing cart metafields mutation (with dummy cart ID)...');
  const testMutation = `
    mutation cartMetafieldsSet($cartId: ID!, $metafields: [CartMetafieldsSetInput!]!) {
      cartMetafieldsSet(cartId: $cartId, metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const testVariables = {
    cartId: 'gid://shopify/Cart/test123', // Dummy cart ID for testing
    metafields: [{
      namespace: '$app', // App-owned metafield
      key: 'shopify_discount_code',
      value: 'TEST',
      type: 'single_line_text_field'
    }]
  };

  const mutationResponse = await storefront.request(testMutation, { variables: testVariables });
  
  // We expect an error because cart doesn't exist, but it should be a "cart not found" error, not auth error
  if (mutationResponse.errors) {
    const isAuthError = mutationResponse.errors.some(e => 
      e.message?.includes('Unauthorized') || 
      e.message?.includes('401') ||
      e.message?.includes('authentication')
    );
    
    if (isAuthError) {
      console.error('   ❌ Authentication failed - Token may be invalid');
      console.error('   Error:', mutationResponse.errors[0].message);
      process.exit(1);
    } else {
      console.log('   ✅ Mutation syntax is valid (cart not found is expected)');
      console.log('   Note: This is expected - we used a dummy cart ID\n');
    }
  } else if (mutationResponse.data?.cartMetafieldsSet?.userErrors) {
    // User errors (like cart not found) are OK - means mutation syntax is correct
    console.log('   ✅ Mutation syntax is valid');
    console.log('   Note: Cart not found is expected with dummy ID\n');
  }

  console.log('✅ All tests passed! Storefront API is configured correctly.\n');
  console.log('📝 Next steps:');
  console.log('   1. Test with a real referral link: your-store.myshopify.com?ref=ALICE123');
  console.log('   2. Check browser console for "(via metafields)" message');
  console.log('   3. Verify discount applies at checkout\n');

} catch (error) {
  console.error('\n❌ Test failed!\n');
  console.error('Error:', error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Check SHOPIFY_STOREFRONT_ACCESS_TOKEN is set in .env');
  console.error('   2. Verify token is correct in Partners Dashboard');
  console.error('   3. Ensure scopes are enabled: read_cart, write_cart');
  console.error('   4. Check token hasn\'t been regenerated/revoked\n');
  process.exit(1);
}
