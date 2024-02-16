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
                    .table(Message::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Message::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Message::MessageType).string()) // chat, notice
                    .col(ColumnDef::new(Message::UserId).integer().not_null())
                    .col(ColumnDef::new(Message::ChatId).integer().not_null())
                    .col(ColumnDef::new(Message::Message).text().not_null())
                    .col(ColumnDef::new(Message::Status).integer().default(1))
                    .col(ColumnDef::new(Message::GroupId).text())
                    .col(ColumnDef::new(Message::Vanilla).text())
                    .col(ColumnDef::new(Message::Context).integer().default(0)) // visitor = 0, agent_ai = 1, agent_human = 2
                    .col(ColumnDef::new(Message::Rating).integer().default(0)) // default = 0, good = 1, bad = 2
                    .col(ColumnDef::new(Message::Streaming).integer().default(0)) // default = 0, good = 1, bad = 2
                    .col(
                        ColumnDef::new(Message::CreatedAt)
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
            .drop_table(Table::drop().table(Message::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Message {
    #[iden = "messages"]
    Table,
    Id,
    MessageType,
    UserId,
    ChatId,
    Message,
    Status,
    GroupId,
    Vanilla,
    Context,
    Rating,
    Streaming,
    CreatedAt,
}
