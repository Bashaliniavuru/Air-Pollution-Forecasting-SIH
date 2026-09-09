from typing import List
from fastapi import APIRouter
from models.schemas import TaskRequest, TaskResponse
from services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/tasks/execute", response_model=TaskResponse, summary="Execute Coupled Air Pollution-Weather Forecast")
def execute_task(task_req: TaskRequest) -> TaskResponse:
    """
    Triggers the coupled forecasting pipeline for a target Delhi-NCR station or custom meteorology payload.
    """
    response = ai_service.execute_task(
        task_type=task_req.task_type,
        input_data=task_req.input_data,
        station_id=task_req.station_id
    )
    return response


@router.get("/tasks/history", response_model=List[TaskResponse], summary="Retrieve Forecast Task History")
def get_task_history(limit: int = 10) -> List[TaskResponse]:
    """
    Retrieves recent coupled forecast execution records and model predictions.
    """
    return ai_service.get_task_history(limit=limit)
