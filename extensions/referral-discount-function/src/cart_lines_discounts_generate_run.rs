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

    // Get the one-time code from cart attribute (queried by key)
    // We only validate it exists - actual validation happens server-side on order creation
    let has_one_time_code = input
        .cart()
        .gachi_one_time_code()
        .and_then(|attr| attr.value())
        .map(|s| s.to_string())
        .map_or(false, |s| !s.is_empty());

    // If no one-time code, no discount
    if !has_one_time_code {
        return Ok(schema::CartLinesDiscountsGenerateRunResult { operations: vec![] });
    }

    // Get discount percentage from cart attribute or use default
    let discount_percentage = input
        .cart()
        .gachi_discount_percentage()
        .and_then(|attr| attr.value())
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(10.0);

    // Get discount type from cart attribute or use default
    let discount_type = input
        .cart()
        .gachi_discount_type()
        .and_then(|attr| attr.value())
        .map_or("percentage".to_string(), |s| s.to_string());

    // Get cart total for fixed amount calculations
    // Decimal type from shopify_function can be converted using to_string then parse
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
                associated_discount_code: None,
            }],
        },
    );

    Ok(schema::CartLinesDiscountsGenerateRunResult {
        operations: vec![operation],
    })
}

