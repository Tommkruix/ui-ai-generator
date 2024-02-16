use sea_orm::DatabaseConnection;

// shared state
pub struct AppState {
    pub db: DatabaseConnection,
}


