# AIEDU Full-Stack Workspace

This repository hosts both the FastAPI backend and the React/Lovable frontend for the AIEDU project. Branches are organised so the full system can be integrated on `main`, while individual stacks remain easy to evolve.

## Branch Layout

- `backend`: FastAPI service powering LLM features and future APIs.
- `frontend`: UI generated via Lovable (Vite + React + shadcn-ui + Tailwind CSS).
- `main`: Canonical integration branch that should always build end-to-end.

## Backend (FastAPI)

- Python 3.10+
- FastAPI, Pydantic, `pydantic-settings`, LangChain placeholder
- Async HTTP via `httpx`

### Local setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # populate secrets such as OPENAI_API_KEY
uvicorn app.main:app --reload
```

### Tests

```bash
pip install .[dev]  # optional: install test deps from pyproject
pytest
```

### Layout

```
app/
  core/          # configuration, logging, and startup hooks
  api/           # FastAPI routers and dependencies
  services/      # business logic and orchestration
  clients/       # integrations with LLM providers or external APIs
  schemas/       # pydantic models shared across layers
tests/            # pytest-based test suite
```

## Frontend (Lovable / Vite + React)

- Vite, TypeScript, React
- shadcn-ui + Tailwind CSS component system

### Local setup

The UI is generated and synced via Lovable. You can continue iterating on the hosted editor or work locally:

```bash
# install dependencies (requires Node.js; nvm recommended)
npm install

# run the dev server with hot reload
npm run dev
```

Lovable dashboard for this project: `https://lovable.dev/projects/8a04d4fc-b640-4afb-abea-b16705cbf903`

## Working Across Branches

1. Update specialised branches:
   - Backend: `git checkout backend && git pull`
   - Frontend: `git checkout frontend && git pull`
2. Merge into `main` once both sides build and pass checks:
   - `git checkout main`
   - `git merge backend`
   - `git merge frontend`
3. Push `main` to share a consistent snapshot of the entire platform.

## Deployment Notes

- Frontend deploys directly from Lovable (Share → Publish). Custom domains can be configured in the Lovable project settings.
- Backend deployment strategy is open; Docker + cloud hosting can be added when ready.
