import datetime
import uuid
from typing import Any, Dict


def generate_id(prefix: str = "obj") -> str:
    """
    Generates a unique prefixed identifier.
    """
    short_uuid = uuid.uuid4().hex[:10]
    return f"{prefix}_{short_uuid}"


def get_utc_timestamp() -> str:
    """
    Returns current UTC timestamp in ISO 8601 format.
    """
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sanitize_dict(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Removes keys with None values and cleans empty strings.
    """
    return {k: v for k, v in payload.items() if v is not None}
