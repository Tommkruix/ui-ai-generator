use axum::{
    http::StatusCode,
    response::{IntoResponse, Json, Response},
};
use sea_orm::DbErr;
use serde_json::json;
use thiserror::Error as ThisError;

#[derive(ThisError, Debug)]
pub enum Error {
    #[error("Database error: {0}")]
    DbErr(#[from] DbErr),
    // #[error("Invalid token")]
    // InvalidToken,
    #[error("{0}")]
    Custom(String),
}

pub type Result<T> = std::result::Result<T, Error>;

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let (status, err_msg) = match self {
            Error::DbErr(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", e),
            ),
            // Error::InvalidToken => (
            //     StatusCode::BAD_REQUEST,
            //     "Invalid token".to_string(),
            // ),
            Error::Custom(msg) => (
                StatusCode::BAD_REQUEST,
                msg,
            ),
        };
        (status, Json(json!({ "error": err_msg }))).into_response()
    }
}
