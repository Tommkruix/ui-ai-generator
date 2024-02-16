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
                    .table(ChatMember::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ChatMember::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ChatMember::UserId).integer().not_null())
                    .col(ColumnDef::new(ChatMember::ChatId).integer().not_null())
                    .col(ColumnDef::new(ChatMember::Status).integer().default(1))
                    .col(ColumnDef::new(ChatMember::Role).string()) // visitor, agent_human, agent_ai
                    .col(ColumnDef::new(ChatMember::Assigned).integer().default(1))
                    .col(
                        ColumnDef::new(ChatMember::CreatedAt)
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
            .drop_table(Table::drop().table(ChatMember::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum ChatMember {
    #[iden = "chat_members"]
    Table,
    Id,
    UserId,
    ChatId,
    Status,
    Role,
    Assigned,
    CreatedAt,
}
