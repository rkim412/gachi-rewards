use shopify_function::prelude::*;
use shopify_function::Result;
use crate::schema;

#[shopify_function]
fn cart_lines_discounts_generate_run(
    input: schema::cart_lines_discounts_generate_run::Input,
) -> Result<schema::CartLinesDiscountsGenerateRunResult> {
    // Check if discount applies to ORDER class
    let has_order_discount_class = input
        .discount()
        .discount_classes()
        .contains(&schema::DiscountClass::Order);
    
    if !has_order_discount_class {
        return Ok(schema::CartLinesDiscountsGenerateRunResult { operations: vec![] });
    }

    // ============================================
    // PRIORITY 1: Read from App Discount metafields
    // These are set when the discount code was created via discountCodeAppCreate
    // ============================================
    let discount_percentage_from_discount = input
        .discount()
        .metafield_discount_percentage()
        .and_then(|mf| mf.value().parse::<f64>().ok());

    let discount_type_from_discount = input
        .discount()
        .metafield_discount_type()
        .map(|mf| mf.value().to_string());

    // ============================================
    // PRIORITY 2: Fallback to cart metafields (backward compatibility)
    // ============================================
    let discount_code_from_cart_metafield = input
        .cart()
        .metafield_shopify_discount_code()
        .map(|mf| mf.value().to_string());

    let discount_percentage_from_cart_metafield = input
        .cart()
        .metafield_discount_percentage()
        .and_then(|mf| mf.value().parse::<f64>().ok());

    let discount_type_from_cart_metafield = input
        .cart()
        .metafield_discount_type()
        .map(|mf| mf.value().to_string());

    // ============================================
    // PRIORITY 3: Fallback to cart attributes (legacy)
    // ============================================
    let discount_code_from_attributes = input
        .cart()
        .referral_shopify_discount_code()
        .and_then(|attr| attr.value())
        .map(|s| s.to_string());

    let discount_percentage_from_attributes = input
        .cart()
        .referral_discount_percentage()
        .and_then(|attr| attr.value())
        .and_then(|s| s.parse::<f64>().ok());

    let discount_type_from_attributes = input
        .cart()
        .referral_discount_type()
        .and_then(|attr| attr.value())
        .map(|s| s.to_string());

    // ============================================
    // Resolve final values with priority
    // ============================================
    
    // Check if this was triggered by an App discount (has discount metafields)
    let is_app_discount = discount_percentage_from_discount.is_some();

    // Discount percentage: App discount metafields > cart metafields > cart attributes > default
    let discount_percentage = discount_percentage_from_discount
        .or(discount_percentage_from_cart_metafield)
        .or(discount_percentage_from_attributes)
        .unwrap_or(10.0);

    // Discount type: App discount metafields > cart metafields > cart attributes > default
    let discount_type = discount_type_from_discount
        .or(discount_type_from_cart_metafield)
        .or(discount_type_from_attributes)
        .unwrap_or_else(|| "percentage".to_string());

    // Discount code from cart (for legacy flow)
    // For App discounts, this may be empty - Shopify handles the code association
    let shopify_discount_code_value = discount_code_from_cart_metafield
        .or(discount_code_from_attributes)
        .unwrap_or_default();

    // Determine if we should apply a discount:
    // 1. App discount triggered (has discount metafields) - always apply
    // 2. Legacy flow (has discount code in cart) - apply if code exists
    let should_apply = is_app_discount || !shopify_discount_code_value.is_empty();

    if !should_apply {
        return Ok(schema::CartLinesDiscountsGenerateRunResult { operations: vec![] });
    }

    // Get cart total for fixed amount calculations
    let cart_total = input
        .cart()
        .cost()
        .total_amount()
        .amount()
        .to_string()
        .parse::<f64>()
        .unwrap_or(0.0);

    // Build the discount value
    let discount_value = if discount_type == "percentage" || discount_type.is_empty() {
        schema::OrderDiscountCandidateValue::Percentage(schema::Percentage {
            value: Decimal(discount_percentage),
        })
    } else {
        // Fixed amount discount
        let fixed_amount = discount_percentage.min(cart_total);
        schema::OrderDiscountCandidateValue::FixedAmount(schema::FixedAmount {
            amount: Decimal(fixed_amount),
        })
    };

    // Create the order discount operation
    // For App discounts, Shopify automatically associates the discount code
    // For legacy flow, we need to include the associated_discount_code
    let associated_code = if shopify_discount_code_value.is_empty() {
        None
    } else {
        Some(schema::AssociatedDiscountCode {
            code: shopify_discount_code_value,
        })
    };

    let operation = schema::CartOperation::OrderDiscountsAdd(
        schema::OrderDiscountsAddOperation {
            selection_strategy: schema::OrderDiscountSelectionStrategy::First,
            candidates: vec![schema::OrderDiscountCandidate {
                targets: vec![schema::OrderDiscountCandidateTarget::OrderSubtotal(
                    schema::OrderSubtotalTarget {
                        excluded_cart_line_ids: vec![],
                    },
                )],
                message: Some(format!("Referral Discount ({:.0}%)", discount_percentage)),
                value: discount_value,
                conditions: None,
                associated_discount_code: associated_code,
            }],
        },
    );

    Ok(schema::CartLinesDiscountsGenerateRunResult {
        operations: vec![operation],
    })
}

