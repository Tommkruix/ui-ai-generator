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
                    .table(Chat::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Chat::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Chat::ChatType).string()) // chat
                    .col(ColumnDef::new(Chat::Title).string())
                    .col(ColumnDef::new(Chat::Slug).string())
                    .col(ColumnDef::new(Chat::LastMessage).string())
                    .col(ColumnDef::new(Chat::Status).integer().default(1))
                    .col(ColumnDef::new(Chat::AiMode).integer().default(1))
                    .col(ColumnDef::new(Chat::ProjectId).integer())
                    .col(ColumnDef::new(Chat::Prompt).string())
                    .col(ColumnDef::new(Chat::Model).string())
                    .col(ColumnDef::new(Chat::ModelProvider).string())
                    .col(ColumnDef::new(Chat::RecallThreshold).integer().default(0))
                    .col(ColumnDef::new(Chat::MaxToken).integer().default(1024))
                    .col(ColumnDef::new(Chat::Temperature).integer().default(0))
                    .col(
                        ColumnDef::new(Chat::CreatedAt)
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
            .drop_table(Table::drop().table(Chat::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Chat {
    #[iden = "chats"]
    Table,
    Id,
    ChatType,
    Title,
    Slug,
    LastMessage,
    Status,
    AiMode,
    ProjectId,
    Prompt,
    Model,
    ModelProvider,
    RecallThreshold,
    MaxToken,
    Temperature,
    CreatedAt,
}
