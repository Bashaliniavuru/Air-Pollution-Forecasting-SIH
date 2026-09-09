# Services Layer (`services/`)

The services directory contains the business logic, orchestrators, and data pipelines powering the Air Pollution-Weather Coupled Forecasting System for Delhi-NCR.

## Services Overview

- **`data_service.py`**: Handles ingestion and querying of Delhi-NCR monitoring station data (Anand Vihar, ITO, RK Puram, Punjabi Bagh), raw CPCB and IMD weather telemetry, and local storage.
- **`ai_service.py`**: Coordinates multi-horizon coupled forecasting models, ventilation coefficient evaluations, thermal inversion risk detection, and GRAP mitigation trigger recommendations.
- **`notification_service.py`**: Dispatches environmental early warnings, severe stagnation alerts, and operational event logs.

## Best Practices

1. Endpoints in `backend/api/` should remain thin and delegate complex business operations to the service layer.
2. Services should log events using `utils.logger.setup_logger`.
3. Model and schema contracts should be imported from `models/schemas.py`.
