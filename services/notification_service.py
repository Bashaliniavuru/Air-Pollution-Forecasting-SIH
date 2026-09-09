from typing import Any, Dict, List
from utils.logger import setup_logger
from utils.helpers import generate_id, get_utc_timestamp

logger = setup_logger("notification_service")


class NotificationService:
    """
    Manages operational notifications, alerts, and event logging.
    """
    
    def __init__(self):
        self._alerts: List[Dict[str, Any]] = [
            {
                "id": generate_id("alert"),
                "level": "INFO",
                "message": "System platform initialized successfully.",
                "timestamp": get_utc_timestamp()
            }
        ]

    def create_alert(self, level: str, message: str) -> Dict[str, Any]:
        alert = {
            "id": generate_id("alert"),
            "level": level.upper(),
            "message": message,
            "timestamp": get_utc_timestamp()
        }
        self._alerts.append(alert)
        logger.info(f"[{level.upper()}] Alert generated: {message}")
        return alert

    def get_recent_alerts(self, limit: int = 5) -> List[Dict[str, Any]]:
        return self._alerts[-limit:]
