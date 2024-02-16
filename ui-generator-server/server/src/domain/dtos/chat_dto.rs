use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RequestChatSchema {
    pub message: String,
    pub group_id: String,
}

#[derive(Deserialize, Debug)]
pub struct Pagination {
    pub per_page: Option<u64>,
    pub page: Option<u64>,
}


#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ChatResponse {
    pub message: Option<RemoteResponse>,
    pub remark: String,
}


#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatRoot {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    pub usage: Usage,
    pub choices: Vec<Choice>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Usage {
    #[serde(rename = "prompt_tokens")]
    pub prompt_tokens: i64,
    #[serde(rename = "completion_tokens")]
    pub completion_tokens: i64,
    #[serde(rename = "total_tokens")]
    pub total_tokens: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Choice {
    pub message: Message,
    #[serde(rename = "finish_reason")]
    pub finish_reason: String,
    pub index: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub role: String,
    pub content: String,
}


#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RemoteResponse {
    pub original_message: String,
    pub vanilla_code: String,
}



#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SetRatingSchema {
    pub id: i32,
    pub rating: i32,
}