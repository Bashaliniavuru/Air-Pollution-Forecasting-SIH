from enum import Enum


class AppStatus(str, Enum):
    INITIALIZING = "INITIALIZING"
    ONLINE = "ONLINE"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AQICategory(str, Enum):
    GOOD = "GOOD"                 # 0-50
    SATISFACTORY = "SATISFACTORY" # 51-100
    MODERATE = "MODERATE"         # 101-200
    POOR = "POOR"                 # 201-300
    VERY_POOR = "VERY_POOR"       # 301-400
    SEVERE = "SEVERE"             # 401-500
    SEVERE_PLUS = "SEVERE_PLUS"   # >500


DEFAULT_API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Air Pollution-Weather Coupled Forecasting System (Delhi-NCR)"
VERSION = "1.0.0"
FOCUS_REGION = "Delhi-NCR"
