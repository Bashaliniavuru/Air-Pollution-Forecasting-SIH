from typing import Any, Dict, List, Optional
from models.ml_models import BaselineScorer
from models.schemas import TaskStatus, TaskResponse
from utils.logger import setup_logger
from utils.helpers import generate_id, get_utc_timestamp

logger = setup_logger("ai_service")


class AIService:
    """
    Coordinates coupled weather-pollution forecasting algorithms for Delhi-NCR.
    """
    
    def __init__(self):
        self.scorer = BaselineScorer()
        self._task_history: List[TaskResponse] = []
        logger.info("AIService initialized with coupled Delhi-NCR forecaster.")

    def run_inference(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Runs multi-variate coupled forecasting inference."""
        logger.info(f"Running coupled forecast inference for payload keys: {list(payload.keys())}")
        prediction = self.scorer.predict(payload)
        return prediction

    def execute_task(self, task_type: str, input_data: Dict[str, Any], station_id: Optional[str] = "DELHI_ANAND_VIHAR") -> TaskResponse:
        """Executes a forecasting/inversion analysis task and records results."""
        task_id = generate_id("task")
        created_at = get_utc_timestamp()
        
        try:
            # Default input parameters for Delhi-NCR if unspecified
            merged_inputs = {
                "pm2_5": input_data.get("pm2_5", 218.4 if station_id == "DELHI_ANAND_VIHAR" else 185.0),
                "pm10": input_data.get("pm10", 340.2 if station_id == "DELHI_ANAND_VIHAR" else 290.0),
                "wind_speed_kmh": input_data.get("wind_speed_kmh", 4.8),
                "humidity_pct": input_data.get("humidity_pct", 82.0),
                "temp_c": input_data.get("temp_c", 18.2),
                "pbl_height_m": input_data.get("pbl_height_m", 380.0),
                **input_data
            }
            
            inference_result = self.run_inference(merged_inputs)
            response = TaskResponse(
                task_id=task_id,
                status=TaskStatus.COMPLETED,
                task_type=task_type,
                station_id=station_id,
                result=inference_result,
                created_at=created_at,
                completed_at=get_utc_timestamp(),
                message=f"Coupled forecast for task '{task_type}' at station '{station_id}' completed successfully."
            )
        except Exception as e:
            logger.error(f"Coupled forecast execution failed: {str(e)}")
            response = TaskResponse(
                task_id=task_id,
                status=TaskStatus.FAILED,
                task_type=task_type,
                station_id=station_id,
                result=None,
                created_at=created_at,
                completed_at=get_utc_timestamp(),
                message=f"Execution error: {str(e)}"
            )
            
        self._task_history.append(response)
        return response

    def get_task_history(self, limit: int = 10) -> List[TaskResponse]:
        """Returns recent task execution history."""
        return self._task_history[-limit:]
