use dotenv::dotenv;

use std::{net::SocketAddr, sync::Arc};

use axum::{
    routing::{get, post, delete},
    Router,
};
use tower_http::add_extension::AddExtensionLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    app::{
        handler::chat::{get_messages_by_chat_slug, store_message, set_ratings, delete_message, delete_messages_by_group_id},
        infra::{cors::cors_layer, database::Database},
    },
    domain::entities::app_state::AppState,
};

mod app;
mod domain;
mod exception;

#[tokio::main]
async fn main() {
    env_check();

    let db = Database::init().await.expect("Unable to connect to db");

    let app_state = Arc::new(AppState { db: db.clone() });

    let api_routes = Router::new()
        .with_state(app_state)
        .route("/authenticate", post(root_path))
        .route("/verify-code", post(root_path))
        .route("/chats", get(root_path))
        .route("/chats/messages/:slug", get(get_messages_by_chat_slug))
        .route("/messages/set-rating", post(set_ratings))
        .route("/messages/delete/:id", delete(delete_message))
        .route("/messages/delete-group/:group_id", delete(delete_messages_by_group_id))
        .route("/chats/:slug", get(root_path))
        .route("/chats/store-message", post(store_message));

    let app = Router::new()
        .route("/", get(root_path))
        .nest("/api", api_routes)
        .layer(cors_layer())
        .layer(AddExtensionLayer::new(db));

    let addr = SocketAddr::from(([0, 0, 0, 0], 7401));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}

async fn root_path() -> &'static str {
    "Ready 🧡🎉"
}

fn env_check() {
    dotenv().ok();
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "backend=debug,tower_http=debug");
        println!("Ready 🧡🎉");
    }
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "app_chat=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}
