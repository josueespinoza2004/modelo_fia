from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.database import clear_session_chat, clear_session_memory, get_session
from app.models.schemas import QuizRequest, QuizResponse, SommelierRequest, SommelierResponse
from app.services.sommelier_service import ask_sommelier, evaluate_taste_quiz

router = APIRouter(prefix="/api/sommelier", tags=["Sommelier AI"])


@router.post("", response_model=SommelierResponse)
async def chat_with_sommelier(payload: SommelierRequest):
    if not payload.message or not payload.message.strip():
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Mensaje requerido"},
        )

    return await ask_sommelier(
        message=payload.message,
        history=payload.history,
        prev_memory=payload.userMemory,
        session_id=payload.sessionId,
    )


@router.post("/quiz", response_model=QuizResponse)
def submit_taste_quiz(payload: QuizRequest):
    return evaluate_taste_quiz(
        method=payload.method,
        flavor=payload.flavor,
        milk=payload.milk,
        prev_memory=payload.userMemory,
        session_id=payload.sessionId,
    )


@router.get("/session/{session_id}")
def read_sommelier_session(session_id: str):
    if not session_id.strip():
        raise HTTPException(status_code=400, detail="session_id inválido")
    data = get_session(session_id.strip())
    return {
        "success": True,
        "messages": data["messages"],
        "userMemory": data["userMemory"].model_dump(),
    }


@router.delete("/session/{session_id}/chat")
def reset_sommelier_chat(session_id: str):
    clear_session_chat(session_id.strip())
    return {"success": True, "message": "Conversación reiniciada"}


@router.delete("/session/{session_id}/memory")
def forget_sommelier_memory(session_id: str):
    clear_session_memory(session_id.strip())
    return {"success": True, "message": "Memoria sensorial eliminada"}

