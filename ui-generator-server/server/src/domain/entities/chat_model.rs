use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "chats")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub chat_type: String,
    pub title: String,
    pub slug: String,
    pub last_message: Option<String>,
    pub status: i32,
    pub ai_mode: i32,
    #[sea_orm(default_value = "You are a confident, super intelligent, all-knowing LLM ready to solve my problems.")]
    pub prompt: String,
    #[sea_orm(default_value = "gpt-3.5-turbo")]
    pub model: String,
    #[sea_orm(default_value = "openai")]
    pub model_provider: String,
    #[sea_orm(default_value = 5)]
    pub recall_threshold: i32,
    #[sea_orm(default_value = 1024)]
    pub max_token: i32,
    #[sea_orm(default_value = 0)]
    pub temperature: i32,
    pub project_id: Option<i32>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}


