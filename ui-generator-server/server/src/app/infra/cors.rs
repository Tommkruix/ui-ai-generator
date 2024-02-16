use reqwest::Method;
use tower_http::cors::CorsLayer;

pub fn cors_layer() -> CorsLayer {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_credentials(true);
    if std::env::var("APP_ENV").unwrap() == "production" {
        let origins = ["https://sample-site.com".parse().unwrap()];
        return cors.allow_origin(origins);
    } else {
        return CorsLayer::permissive();
    }
}
