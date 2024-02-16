use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "verifications")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub code: String,
    pub recipient: String,
    pub expiration: DateTime,
    pub user_id: i32,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
