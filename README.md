# AIEDU Backend

FastAPI-based backend scaffold for AI-powered education products. The layout is designed for rapid iteration with LLM providers while keeping the project modular and testable.

## Stack

- Python 3.10+
- FastAPI for the web framework
- Pydantic & `pydantic-settings` for configuration
- Async HTTP via `httpx`
- LangChain placeholder for advanced orchestration

## Getting Started

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # populate secrets such as OPENAI_API_KEY
uvicorn app.main:app --reload
```

## Running Tests

```bash
pip install .[dev]  # optional: install test deps from pyproject
pytest
```

## Project Layout

```
app/
  core/          # configuration, logging, and startup hooks
  api/           # FastAPI routers and dependencies
  services/      # business logic and orchestration
  clients/       # integrations with LLM providers or external APIs
  schemas/       # pydantic models shared across layers
tests/            # pytest-based test suite
```

## Next Steps

- Implement provider-specific clients beyond OpenAI
- Add persistence (PostgreSQL, Redis) as product requirements emerge
- Harden security (auth, rate limiting) before production deployments
