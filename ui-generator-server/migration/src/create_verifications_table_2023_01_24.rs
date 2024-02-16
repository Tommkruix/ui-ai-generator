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
                    .table(Verification::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Verification::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Verification::Code).string().not_null())
                    .col(ColumnDef::new(Verification::Recipient).string().not_null())
                    .col(ColumnDef::new(Verification::Expiration).timestamp().not_null())
                    .col(ColumnDef::new(Verification::UserId).integer())
                    .col(
                        ColumnDef::new(Verification::CreatedAt)
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
            .drop_table(Table::drop().table(Verification::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Verification {
    #[iden = "verifications"]
    Table,
    Id,
    Code,
    Recipient,
    Expiration,
    UserId,
    CreatedAt,
}
