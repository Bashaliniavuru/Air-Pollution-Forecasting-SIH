# Data Layer (`data/`)

This directory manages dataset storage, schemas, raw inputs, and processed data artifacts.

## Structure

```
data/
├── raw/                 # Unprocessed sensor feeds, CSV/JSON payloads, and source telemetry
├── processed/           # Feature matrices, normalized tensors, and cleansed datasets
├── sample_dataset.json  # Benchmark seed data for local testing and prototype demonstration
└── README.md            # Data pipeline documentation
```

## Guidelines
- Do not commit large binary dataset files (>50MB) to version control. Store large files in cloud buckets (e.g. S3/GCS) and link via manifest.
- Use `data_service.py` to ingest, load, and serialize data objects.
