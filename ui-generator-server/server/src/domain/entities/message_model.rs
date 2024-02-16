use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "messages")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub message_type: String,
    pub user_id: i32,
    pub chat_id: i32,
    pub message: String,
    #[sea_orm(default_value = 1)]
    pub status: i32,
    pub group_id: Option<String>,
    pub vanilla: Option<String>,
    #[sea_orm(default_value = 0)]
    pub context: i32,
    #[sea_orm(default_value = 0)]
    pub rating: i32,
    #[sea_orm(default_value = 0)]
    pub streaming: i32,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}


