use shopify_function::prelude::*;

#[typegen("schema.graphql")]
pub mod schema {
    #[query("src/run.graphql")]
    pub mod cart_lines_discounts_generate_run {}
}

mod cart_lines_discounts_generate_run;

// Note: No main() function needed for Shopify Functions
// The #[shopify_function] annotated function in cart_lines_discounts_generate_run.rs
// is automatically exported and called by Shopify's runtime
