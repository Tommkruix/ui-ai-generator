use crate::{
    domain::{
        dtos::chat_dto::{
            ChatResponse, ChatRoot, Pagination, RemoteResponse, RequestChatSchema, SetRatingSchema,
        },
        entities::{chat_model, message_model},
    },
    exception::error::{Error, Result as MyResult},
};
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::{IntoResponse, Json},
    Extension,
};
use sea_orm::DatabaseConnection;
use sea_orm::*;
use serde_json::json;
use tokio::time::{sleep, Duration};

pub async fn get_messages_by_chat_slug(
    Extension(ref db): Extension<DatabaseConnection>,
    Path(slug): Path<String>,
    Query(pagination): Query<Pagination>,
) -> MyResult<impl IntoResponse> {
    let chat_model_entity = chat_model::Entity::find()
        .filter(chat_model::Column::Slug.eq(slug))
        .one(db)
        .await;

    let page_size = pagination.per_page.unwrap_or(50);
    let page_number = pagination.page.unwrap_or(1);
    match chat_model_entity {
        Ok(Some(chat)) => {
            let messages = message_model::Entity::find()
                .filter(message_model::Column::ChatId.eq(chat.id))
                .order_by_desc(message_model::Column::CreatedAt)
                .limit(page_size)
                .offset((page_number - 1) * page_size)
                .all(db)
                .await
                .unwrap_or_else(|_| Vec::new());

            return Ok((StatusCode::OK, Json(json!({ "data": messages }))));
        }
        Ok(None) => {
            return Ok((
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Chat not found" })),
            ));
        }
        Err(err) => {
            return Ok((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": find_error(err) })),
            ));
        }
    }
}

pub async fn store_message(
    Extension(ref db): Extension<DatabaseConnection>,
    Json(request): Json<RequestChatSchema>,
) -> MyResult<impl IntoResponse> {
    println!("message: {:?}", &request);
    let new_message = message_model::ActiveModel {
        message_type: Set("chat".to_string()),
        user_id: Set(1),
        chat_id: Set(1),
        message: Set(request.message.clone()),
        context: Set(0),
        group_id: Set(Some(request.group_id.clone())),
        ..Default::default()
    };

    let messages_entities = message_model::Entity::find()
        .filter(message_model::Column::ChatId.eq(1))
        .filter(message_model::Column::Context.eq(1))
        .order_by_desc(message_model::Column::CreatedAt)
        .limit(1 as u64)
        .all(db)
        .await
        .unwrap_or_else(|_| Vec::new());

    let recall_messages: Vec<Value> = messages_entities
        .iter()
        .map(|entity| {
            Value::Json(Some(Box::new(json!({
                "message": entity.message.clone(),
                "created_at": entity.created_at
            }))))
        })
        .collect();

    let _ = new_message.insert(db).await;

    let gpt_response = send_to_gpt(&request.message, recall_messages)
        .await
        .map_err(|_| Error::Custom("Failed to communicate with GPT API".into()))?;

    if let Some(msg) = &gpt_response.message {
        let response_am = message_model::ActiveModel {
            user_id: Set(0),
            chat_id: Set(1),
            message: Set(msg.original_message.to_string()),
            vanilla: Set(Some(msg.vanilla_code.to_string())),
            group_id: Set(Some(request.group_id.clone())),
            message_type: Set("message".to_string()),
            status: Set(1),
            context: Set(1),
            ..Default::default()
        };
        let new_message_entity = response_am.insert(db).await?;
        return Ok((
            StatusCode::OK,
            Json(json!({
                "data": new_message_entity,
            })),
        ));
    };
    Ok((
        StatusCode::BAD_REQUEST,
        Json(json!({
            "data": gpt_response,
        })),
    ))
}

async fn send_to_gpt(
    message: &str,
    recall_messages: Vec<Value>,
) -> Result<ChatResponse, reqwest::Error> {
    let secret_key = std::env::var("OPEN_AI_KEY").expect("export OPEN_AI_SECRET_KEY");
    let formatted_messages: Vec<String> = recall_messages
        .iter()
        .map(|value| match value {
            sea_orm::Value::Json(Some(json_value)) => json_value.to_string(),
            _ => String::from("Unknown format"),
        })
        .collect();
    let formatted_message_string = formatted_messages.join("\n");
    let form_data = json!({
    "model": "gpt-4-1106-preview",
    "max_tokens": 4000,
    "temperature": 0.2,
    "response_format": {
      "type": "json_object",
    },
    "messages": [
        {
            "role": "system",
            "content": "You are a UI-Generator, Nextjs with Tailwind CSS based on user's requirements.
            Also generate a Vanilla js + HTML + Tailwind counterpart.
            Provide response as json_object like this
            {
              original_message: `
              <your message> \n 
              <original nextjs source code here, very important>
              `, 
              vanilla_code: `<vanilla js code only>`
            }
            "
        },
        {
            "role": "system",
            "content": format!("
            Rules of engagement:
            - Respond politely when greeted
            - Be polite when you don't have user needs 
            - Don't provide help outside the scope of Nextjs & Tailwind
            - Write a single code, don't split into components
            - Only provide extra comments when necessary
            - Don't write any comment `vanilla_code` field, just the code pls
            - You can add a little sweet comment in the `original_message` field before the Nextjs code
            - Never forget to add Nextjs source code to `original_message`, VERY IMPORTANT
            - Never forget to add Nextjs source code to `original_message`, VERY IMPORTANT
            - Never forget to add Nextjs source code to `original_message`, VERY IMPORTANT
            - If the user message doesn't involve code, reply politely and convince them to create their code, `vanilla_code` field should be empty
            - You need to import tailwind library in vanilla code
            - No need to import tailwind library in Nextjs code, and no `Head` in Nextjs
            - Make sure the vanilla code is correct, very important
            - `CHAT HISTORY` section is the chat history between user & use`created_at` to get the latest message \n\n
            - `USER REQUIREMENTS` section holds the description of what the user needs.\n\n
            - `ABOUT PROJECT` section hold all the information about the project
            - If the is any item in chat history, look at it keenly to ensure the continuity of the conversation
            - Ensure to follow the common Gestalt principles about design and visualization when responding, VERY IMPORTANT
            ")
        },
        {
            "role": "system",
            "content": format!("CHAT HISTORY: {}\n\n\n\n\n\n", formatted_message_string)
        },
        {
            "role": "system",
            "content": format!("ABOUT PROJECT: {}\n\n\n\n\n\n", "The research work on the AI UI Generator is being conducted at the Donaghey Emerging Analytics Center (EAC) at UA Little Rock, which specializes in a broad range of interactive technologies, including immersive visualization and augmented/virtual/mixed realities. The EAC also delves into cybersecurity, mobile computing, IoT, and machine learning, in collaboration with the Department of Computer Science.

            Tom Coffin, with extensive experience in virtual reality and project management, serves as the Operations Manager and supervisor of the research project at the EAC. His background includes work at the National Center for Supercomputing Applications and the commercialization of CAVE technology.
            
            Dr. Iván Rodríguez-Conde, an expert in human-computer interaction, is the advisor of the research project. His career spans academia and industry, with a focus on interactive 3D graphics systems, UX design, and software tool development.
            
            Ajiferuke Tomiwa, the creator of the AI UI Generator, is a Software Engineer and Tester known for his technological prowess and innovative contributions. His experience in Agile and cloud-based environments, along with accolades from various competitions, underscores his commitment to advancing technology.
            
            The research project was initiated in November 2023, marking the beginning of this innovative endeavor at the EAC. Dr. Ahmed AbuHalimeh is also an advisor of this project, an assistant professor at ualr who specializes in information quality and also applies advanced technologies to enhance organizational services")
        },
        {
            "role": "user",
            "content": format!("USER REQUIREMENTS: {}
            \"\"\"", message)
        }
    ]});

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", secret_key))
        .json(&form_data)
        .send()
        .await?;
    match response.status() {
        StatusCode::OK => {
            match response.json::<ChatRoot>().await {
                Ok(parsed) => {
                    match serde_json::from_str::<RemoteResponse>(
                        parsed.choices[0].message.content.clone().as_str(),
                    ) {
                        Ok(res) => {
                            println!("{:?}", res.clone());
                            return Ok(ChatResponse {
                                message: Some(res),
                                remark: "Success!".into(),
                            });
                        }
                        Err(_) => {
                            return Ok(ChatResponse {
                                message: None,
                                remark: "🛑Unable to parse json".into(),
                            });
                        }
                    };
                }
                Err(_) => {
                    println!("🛑 Hm, the response didn't match the shape we expected.");
                    return Ok(ChatResponse {
                        message: None,
                        remark: "🛑 Hm, the response didn't match the shape we expected.".into(),
                    });
                }
            };
        }
        StatusCode::BAD_REQUEST => {
            return Ok(ChatResponse {
                message: None,
                remark: "Bad request. Check your request parameters.".into(),
            });
        }
        StatusCode::UNAUTHORIZED => {
            return Ok(ChatResponse {
                message: None,
                remark: "Unauthorized, check your API KEY".into(),
            });
        }
        _ => {
            let error_message = match response.status() {
                StatusCode::NOT_FOUND => "Check your selected model".to_string(),
                _ => format!("Unexpected status code: {:?}", response.status()),
            };
            println!("Unexpected status code: {:?}", error_message);
            return Ok(ChatResponse {
                message: None,
                remark: error_message,
            });
        }
    }
}

pub async fn set_ratings(
    Extension(ref db): Extension<DatabaseConnection>,
    Json(message_rating): Json<SetRatingSchema>,
) -> MyResult<impl IntoResponse> {
    let message_to_update = message_model::Entity::find_by_id(message_rating.id)
        .one(db)
        .await
        .map_err(|_| Error::Custom("Message not found".into()))?
        .ok_or_else(|| Error::Custom("Message not found".into()))?;

    let mut active_model = message_to_update.into_active_model();
    active_model.rating = Set(message_rating.rating);
    let updated_message = active_model
        .update(db)
        .await
        .map_err(|_| Error::Custom("Failed to update message rating".into()))?;

    Ok((
        StatusCode::OK,
        Json(json!({
            "data": updated_message,
        })),
    ))
}

pub async fn delete_message(
    Extension(ref db): Extension<DatabaseConnection>,
    Path(message_id): Path<i32>,
) -> MyResult<impl IntoResponse> {
    let message_to_delete = message_model::Entity::find_by_id(message_id)
        .one(db)
        .await
        .map_err(|_| Error::Custom("Failed to delete message".into()))?;

    if let Some(message) = message_to_delete {
        let res: DeleteResult = message.delete(db).await?;
        if res.rows_affected == 0 {
            return Err(Error::Custom("No message found with the given ID".into()));
        }
    }

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Message deleted successfully",
        })),
    ))
}

pub async fn delete_messages_by_group_id(
    Extension(ref db): Extension<DatabaseConnection>,
    Path(group_id): Path<String>,
) -> MyResult<impl IntoResponse> {
    let db_clone = db.clone();
    let group_id_clone = group_id.clone();
    tokio::spawn(async move {
        sleep(Duration::from_secs(10)).await;
        match message_model::Entity::delete_many()
            .filter(message_model::Column::GroupId.eq(group_id))
            .exec(&db_clone)
            .await
        {
            Ok(rs) => {
                if rs.rows_affected == 0 {
                    println!("No messages were deleted for group_id: {}", group_id_clone);
                } else {
                    println!(
                        "Deleted {} messages for group_id: {}",
                        rs.rows_affected, group_id_clone
                    );
                }
            }
            Err(e) => {
                println!(
                    "Failed to delete messages for group_id: {}. Error: {:?}",
                    group_id_clone, e
                );
            }
        }
    });

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Messages deleted successfully",
        })),
    ))
}

pub fn find_error(error: DbErr) -> String {
    match error {
        DbErr::Query(RuntimeErr::SqlxError(error)) => match error {
            _ => format!("Encountered a Sqlx error: {}", error),
        },
        _ => format!("Unexpected Error, please check your input"),
    }
}
