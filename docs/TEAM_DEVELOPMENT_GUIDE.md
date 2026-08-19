# Sahayak — Team Development Guide

## 1. Welcome

Sahayak is being developed by a 5-person team.

The repository has already been prepared with the basic frontend, backend,
service architecture, shared configuration, documentation, and development
structure.

The purpose of this guide is to make sure all five developers work consistently
without accidentally breaking each other's work.

Before writing feature code, read this document and:

- `docs/backend/ARCHITECTURE.md`
- `docs/backend/SERVICE_BLUEPRINT.md`

---

# 2. Repository Structure

The current repository is organized as:

```text
sahayak/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   │
│   ├── services/
│   │   ├── donation_portal/
│   │   ├── donation_service/
│   │   ├── flood_engine/
│   │   ├── news_report/
│   │   ├── registration_service/
│   │   ├── resource_service/
│   │   ├── sos_service/
│   │   ├── ticket_service/
│   │   ├── twin_aggregator/
│   │   └── workforce_orchestrator/
│   │
│   └── shared/
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── store/
│       └── styles/
│
├── docs/
│   └── backend/
│       ├── ARCHITECTURE.md
│       └── SERVICE_BLUEPRINT.md
│
├── .env.example
├── .gitignore
└── README.md
````

---

# 3. Important Principle

## One developer should own a feature area.

Do not randomly modify another developer's feature.

For example:

```text
SOS developer
    ↓
backend/services/sos_service/

Flood developer
    ↓
backend/services/flood_engine/

Resource developer
    ↓
backend/services/resource_service/
```

If you need something from another service, discuss it with that service owner
before changing their internal implementation.

---

# 4. Backend Service Structure

Every backend feature follows this basic structure:

```text
backend/services/<feature_name>/
├── __init__.py
├── router.py
├── schemas.py
├── service.py
└── tests/
    └── __init__.py
```

Additional files are allowed only when they are actually needed.

For example:

```text
repository.py
clients.py
models.py
workers.py
utils.py
```

Do not create files just to make the folder look bigger.

---

# 5. Responsibilities of Backend Files

## `router.py`

Contains FastAPI endpoints.

It should:

* Define routes
* Receive requests
* Validate input using schemas
* Call the service layer
* Return responses

Keep routes thin.

Bad:

```python
@router.post("/something")
async def something(data):
    # 100 lines of business logic
```

Preferred:

```python
@router.post("/something")
async def something(data: SomethingRequest):
    return await process_something(data)
```

---

## `schemas.py`

Contains Pydantic models.

Example:

```python
class SOSRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
```

Schemas should handle:

* Request validation
* Response structure
* Data transfer models

Do not put database queries or business logic here.

---

## `service.py`

Contains the feature's actual business logic.

Example:

```python
async def create_sos(request: SOSRequest):
    # business logic
    ...
```

The router calls the service.

The service performs the actual work.

---

# 6. When to Use `repository.py`

Do not automatically create a repository.

Start with:

```text
router
   ↓
service
   ↓
database
```

If database operations become large or complicated:

```text
router
   ↓
service
   ↓
repository
   ↓
database
```

Create `repository.py` only when it genuinely improves separation.

---

# 7. External APIs

If your feature communicates with an external API, consider using:

```text
clients.py
```

For example:

```text
flood_engine/
├── router.py
├── schemas.py
├── service.py
├── clients.py
└── tests/
```

Examples of external systems include:

* Open-Meteo
* CWC data
* AI provider
* Future SMS provider

Keep external API communication out of `router.py`.

---

# 8. `main.py` Rules

`backend/main.py` is shared infrastructure.

It should primarily contain:

* FastAPI application creation
* Global middleware
* Startup/shutdown configuration
* Router registration
* Application-level health checks

It should NOT contain feature business logic.

Do not put things like:

```python
@app.post("/sos")
```

directly into `main.py`.

Instead:

```text
main.py
   ↓
sos_service/router.py
   ↓
sos_service/service.py
```

If you need to modify `main.py`, coordinate with the team first.

---

# 9. Shared Folder Rules

`backend/shared/` contains infrastructure shared by multiple services.

Examples:

```text
backend/shared/
├── config.py
├── ...
```

Do not put feature-specific business logic here.

Ask yourself:

> "Would multiple backend services reasonably need this?"

If yes, it may belong in `shared/`.

If only one feature needs it, keep it inside that feature.

---

# 10. Configuration and Environment Variables

Never commit real secrets.

Use:

```text
.env
```

locally.

The repository contains:

```text
.env.example
```

as the template.

Never commit:

```text
.env
```

API keys, passwords, Supabase service keys, tokens, or private credentials.

If a new environment variable is required:

1. Add it to your local `.env`
2. Add its name to `.env.example`
3. Inform the team

Do not put the actual secret in `.env.example`.

---

# 11. Frontend Structure

The frontend uses:

```text
Next.js
TypeScript
Tailwind CSS
```

Feature-specific frontend components belong inside:

```text
frontend/src/components/
```

For example:

```text
frontend/src/components/
├── sos/
├── flood/
├── resource_manager/
└── ...
```

The exact feature structure should remain consistent with the backend feature.

Shared UI components should go into:

```text
frontend/src/components/shared/
```

Do not duplicate the same reusable component across multiple features.

---

# 12. Frontend App Routes

Next.js routes are located in:

```text
frontend/src/app/
```

Examples:

```text
frontend/src/app/
├── admin/
└── citizen/
```

Do not create random top-level routes without discussing the application
navigation structure with the team.

---

# 13. API Contract

Before implementing a backend endpoint, decide:

```text
HTTP method
URL
request body
response body
error responses
authentication requirements
```

Example:

```text
POST /api/v1/sos/request
```

Request:

```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "message": "Need evacuation"
}
```

Response:

```json
{
  "request_id": "uuid",
  "status": "received"
}
```

Frontend and backend developers should agree on the contract before
connecting the UI.

Do not silently change an API response structure after another developer has
started using it.

---

# 14. API Versioning

Use:

```text
/api/v1/
```

for application APIs.

Example:

```text
/api/v1/sos
/api/v1/resources
/api/v1/donations
```

This gives us room to introduce future API versions without immediately
breaking existing clients.

---

# 15. Database Rules

Database structure is shared across the team.

Main database files:

```text
database/schema.sql
database/migrations/
```

Do not casually modify existing tables used by another feature.

If you need a database change:

1. Discuss the change.
2. Decide the schema.
3. Create a migration when appropriate.
4. Update documentation if necessary.
5. Inform frontend/backend developers affected by the change.

Never solve a feature problem by silently changing another feature's database
schema.

---

# 16. Testing

Every feature should eventually contain:

```text
tests/
├── __init__.py
├── test_router.py
└── test_service.py
```

At minimum, test:

* Normal successful behaviour
* Invalid input
* Important edge cases
* Failure conditions

Tests should be close to the feature they test.

---

# 17. Running the Backend

From the repository root:

```bash
cd backend
```

Activate the virtual environment:

```bash
source .venv/Scripts/activate
```

Then run:

```bash
uvicorn main:app --reload
```

The backend should then be available locally.

Health check:

```text
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "sahayak-api"
}
```

---

# 18. Running the Frontend

Open another terminal.

Go to:

```bash
cd frontend
```

Install dependencies if necessary:

```bash
npm install
```

Run:

```bash
npm run dev
```

Do not run frontend commands from the repository root unless specifically
required.

---

# 19. Before Starting Work

Always begin by updating your local branch:

```bash
git checkout main
git pull origin main
```

Then create your feature branch.

Example:

```bash
git checkout -b feature/sos-backend
```

Use descriptive branch names.

Examples:

```text
feature/sos-backend
feature/flood-engine
feature/resource-management
feature/donation-portal
feature/news-report
fix/sos-validation
fix/resource-api
docs/backend-api
```

---

# 20. Never Work Directly on `main`

Do not develop directly on:

```text
main
```

Use a feature branch.

Example:

```bash
git checkout -b feature/my-feature
```

Work there.

---

# 21. Commit Frequently

Make small, meaningful commits.

Good:

```text
feat: add SOS request schema
feat: add SOS creation endpoint
feat: add SOS service validation
test: add SOS service tests
```

Avoid:

```text
update stuff
changes
final
done
new code
```

A commit should ideally represent one logical change.

---

# 22. Before Pushing

Run the relevant checks.

For backend:

```bash
python -m compileall -q backend
```

If tests exist:

```bash
pytest
```

For frontend:

```bash
npm run build
```

Also check:

```bash
git status
```

Make sure you are not accidentally committing:

```text
.env
node_modules/
.next/
.venv/
__pycache__/
```

---

# 23. Push Your Branch

Example:

```bash
git add .
git commit -m "feat: implement SOS request endpoint"
git push -u origin feature/sos-backend
```

Then create a Pull Request on GitHub.

Do not merge your own PR without team review.

---

# 24. Pull Requests

Every PR should explain:

### What changed?

Example:

```text
Implemented SOS request creation API.
```

### Why?

```text
Allows citizens to submit emergency requests.
```

### How was it tested?

```text
python -m compileall -q backend
pytest
```

### Any database changes?

```text
No
```

or:

```text
Added SOS requests table migration.
```

---

# 25. Important Shared Files

The following files/directories affect the entire team:

```text
backend/main.py
backend/shared/
database/schema.sql
database/migrations/
frontend/src/app/layout.tsx
frontend/src/app/globals.css
.env.example
```

Do not make major changes to these files without communicating with the team.

---

# 26. Cross-Service Communication

Avoid directly importing another service's internal implementation.

Avoid:

```python
from services.other_service.service import some_internal_function
```

unless the architecture explicitly requires it.

Prefer:

* Shared abstractions
* Well-defined APIs
* Shared infrastructure
* Explicit interfaces

This keeps services independent.

---

# 27. Feature Ownership

Each developer should have clear ownership.

Example:

```text
Developer 1
    ↓
SOS + Registration

Developer 2
    ↓
Flood Engine + Digital Twin

Developer 3
    ↓
Resource Management + Workforce

Developer 4
    ↓
Donation Portal + Donation Coordination

Developer 5
    ↓
News Report + Ticketing
```

The exact assignment can be changed by the team.

The important rule is:

> One owner per feature, with collaboration when integration is required.

---

# 28. Do Not Over-Engineer

Start simple.

A feature does NOT need:

```text
repository.py
clients.py
models.py
workers.py
utils.py
events.py
factories.py
```

just because these files exist in other projects.

Start with:

```text
__init__.py
router.py
schemas.py
service.py
tests/
```

Add complexity only when the feature actually requires it.

---

# 29. If You Are Unsure

Before making a large architectural change, ask the team.

Especially before modifying:

```text
backend/main.py
backend/shared/
database/
API contracts
authentication
environment configuration
frontend global state
```

Small feature-level changes can generally be handled independently.

Large cross-cutting changes should be discussed first.

---

# 30. Golden Rule

The most important rule of the project:

> Make your feature easy for the other four developers to understand,
> integrate, test, and maintain.

Do not optimize only for:

> "My feature works."

Optimize for:

> "My feature works and another developer can safely build on it."

---

# 31. Current Project Status

The following setup has already been completed:

* Git repository initialized
* Root project structure created
* Next.js + TypeScript frontend created
* Tailwind CSS configured
* Frontend dependencies installed
* Backend virtual environment created
* FastAPI configured
* Backend dependencies installed
* `requirements.txt` created
* Backend application entry point created
* Shared configuration created
* Backend service architecture created
* Service blueprint documented
* Backend architecture documented
* Feature service skeletons created
* Git ignore rules configured
* Initial architecture changes committed and pushed

Do not recreate these things.

Start development from the existing structure.

---

# 32. First Task for Every Developer

Before writing feature code:

1. Pull the latest `main`.
2. Create your feature branch.
3. Read:

   * `docs/backend/ARCHITECTURE.md`
   * `docs/backend/SERVICE_BLUEPRINT.md`
   * this document
4. Find your assigned service.
5. Inspect its existing files.
6. Discuss the API contract with the relevant frontend developer.
7. Implement the feature inside your assigned service.
8. Add tests.
9. Run the required checks.
10. Push your branch.
11. Open a Pull Request.

---

# Final Principle

Sahayak is a team project.

The repository structure exists to allow five developers to work in parallel.

Keep features isolated.

Keep shared infrastructure stable.

Keep APIs predictable.

Keep commits small.

Communicate before making cross-feature changes.

Build simple solutions first and add complexity only when it is justified.