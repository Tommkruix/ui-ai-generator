pub use sea_orm_migration::prelude::*;

mod create_chat_members_table;
mod create_chats_table;
mod create_messages_table;
mod create_users_table;
mod create_verifications_table_2023_01_24;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(create_chats_table::Migration),
            Box::new(create_chat_members_table::Migration),
            Box::new(create_messages_table::Migration),
            Box::new(create_users_table::Migration),
            Box::new(create_verifications_table_2023_01_24::Migration),
        ]
    }
}
