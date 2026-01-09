use shopify_function::prelude::*;

#[typegen("schema.graphql")]
pub mod schema {
    #[query("src/run.graphql")]
    pub mod cart_lines_discounts_generate_run {}
}

mod cart_lines_discounts_generate_run;

fn main() {
    log!("Invoke a named export");
    std::process::abort();
}
