use chrono::prelude::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(User::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(User::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(User::Name).string().not_null())
                    .col(ColumnDef::new(User::Email).string().not_null())
                    .col(ColumnDef::new(User::Password).string())
                    .col(ColumnDef::new(User::Phone).string())
                    .col(ColumnDef::new(User::Role).string().not_null()) // admin, user
                    .col(ColumnDef::new(User::Avatar).string())
                    .col(ColumnDef::new(User::Status).integer().not_null().default(1))
                    .col(
                        ColumnDef::new(User::CreatedAt)
                            .timestamp()
                            .default(Utc::now())
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(User::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum User {
    #[iden = "users"]
    Table,
    Id,
    Name,
    Email,
    Password,
    Phone,
    Role,
    Avatar,
    Status,
    CreatedAt,
}
