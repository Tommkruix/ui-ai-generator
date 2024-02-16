use std::env::var;
use std::time::Duration;

use sea_orm::{ConnectOptions, Database as Db, DatabaseConnection, DbErr};

#[derive(Clone)]
pub struct Database {
    pub db: DatabaseConnection,
}

impl Database {
    pub async fn init() -> Result<DatabaseConnection, DbErr> {
        // setup connection pool
        let db_connection_str = var("DATABASE_URL").expect("export DATABASE_URL");
        let mut opts = ConnectOptions::new(db_connection_str);
        opts.max_connections(100)
            .min_connections(5)
            .connect_timeout(Duration::from_secs(8))
            .idle_timeout(Duration::from_secs(8))
            .sqlx_logging(true);
        Db::connect(opts)
            .await
    }
}
