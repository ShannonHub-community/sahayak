# Sahayak Backend Architecture

## 1. Purpose

The Sahayak backend is organized as a modular FastAPI application.

The architecture is designed for a five-person development team where each
developer can work independently on a feature while minimizing conflicts
between feature implementations.

The backend follows three main principles:

1. Feature ownership.
2. Thin shared infrastructure.
3. Clear separation between API routing and business logic.

---

## 2. High-Level Structure

```text
backend/
├── main.py
│
├── services/
│   ├── twin_aggregator/
│   ├── ticket_service/
│   ├── news_report/
│   ├── resource_service/
│   ├── donation_service/
│   ├── registration_service/
│   ├── sos_service/
│   ├── donation_portal/
│   ├── workforce_orchestrator/
│   └── flood_engine/
│
└── shared/
````

The `services/` directory contains feature-specific backend implementations.

The `shared/` directory contains infrastructure used by multiple services.

---

# 3. Application Entry Point

## `backend/main.py`

`main.py` is the single application entry point.

Its responsibilities are limited to application-level concerns.

It should:

* Create the FastAPI application.
* Configure middleware.
* Configure application startup and shutdown.
* Register feature routers.
* Register application-level health checks.
* Configure global exception handling when required.

It should NOT contain:

* Feature business logic.
* Database queries for a specific feature.
* Feature-specific validation.
* Feature-specific external API logic.
* Large helper functions belonging to a feature.

The intended flow is:

```text
Client
   ↓
FastAPI application
   ↓
Feature router
   ↓
Feature service
   ↓
Database / external system
```

---

# 4. Feature Services

Every backend feature lives under:

```text
backend/services/
```

Each feature owns its own service directory.

Example:

```text
backend/services/sos_service/
```

A service normally contains:

```text
sos_service/
├── __init__.py
├── router.py
├── schemas.py
├── service.py
└── tests/
```

The detailed rules for individual services are defined in:

```text
docs/backend/SERVICE_BLUEPRINT.md
```

---

# 5. Router Layer

The `router.py` file defines the public API endpoints for a feature.

Example:

```text
POST /api/sos
GET  /api/sos/{id}
```

The router should be responsible for:

* Receiving HTTP requests.
* Reading path/query/body parameters.
* Validating request data through schemas.
* Calling the service layer.
* Returning responses.

The router should remain thin.

Avoid putting business logic directly inside route handlers.

Preferred:

```text
router.py
    ↓
service.py
```

Avoid:

```text
router.py
    ↓
large business logic
    ↓
database
```

---

# 6. Service Layer

`service.py` contains feature-specific business logic.

For example, the SOS service may handle:

* Creating an SOS request.
* Validating feature-specific rules.
* Assigning priority.
* Updating SOS state.
* Coordinating notifications.

The router should not implement these rules.

Preferred:

```text
router
   ↓
service
   ↓
database / external system
```

---

# 7. Schemas

`schemas.py` contains Pydantic models used for API input and output.

Example:

```text
SOSRequest
SOSResponse
SOSStatusResponse
```

Schemas should describe data structures.

They should not contain:

* Database queries.
* External API calls.
* Large business logic.

---

# 8. Database Architecture

Sahayak uses:

```text
PostgreSQL
      ↓
Supabase
```

PostGIS will be used where geographic functionality is required.

The database structure has one source of truth:

```text
database/schema.sql
```

Feature developers must not independently create competing table definitions
inside their service folders.

All database changes must be coordinated through the database schema and
migration process.

---

# 9. Shared Backend Infrastructure

The directory:

```text
backend/shared/
```

contains infrastructure shared across multiple services.

Examples may include:

```text
backend/shared/
├── config.py
├── supabase.py
├── auth.py
├── websocket.py
└── exceptions.py
```

These files should only contain genuinely shared functionality.

Do not place feature-specific logic inside `shared/`.

---

# 10. Shared Code Requires Review

The following areas are considered shared and require review before modification:

```text
backend/main.py
backend/shared/
database/schema.sql
database/migrations/
```

The reason is simple:

A change in these areas can affect multiple developers simultaneously.

Feature-owned code should remain independent whenever possible.

---

# 11. Authentication

Authentication infrastructure belongs in:

```text
backend/shared/
```

Feature services should consume the shared authentication mechanism.

A feature should not implement its own completely separate authentication
system.

Example:

```text
Request
   ↓
Authentication middleware/dependency
   ↓
Feature router
   ↓
Feature service
```

---

# 12. Supabase Access

The Supabase client should be created and configured through shared backend
infrastructure.

Feature services should use the shared Supabase configuration instead of
creating independent global clients.

Example:

```text
backend/shared/supabase.py
          ↓
feature service
          ↓
Supabase
```

This prevents different services from using inconsistent configuration.

---

# 13. WebSocket / Real-Time Architecture

Real-time communication is a shared concern.

The shared WebSocket infrastructure belongs under:

```text
backend/shared/
```

Feature services may publish feature-specific events.

For example:

```text
SOS service
   ↓
event
   ↓
shared WebSocket manager
   ↓
connected clients
```

The WebSocket manager should not contain SOS-specific business rules.

---

# 14. External APIs

External integrations should remain inside the service that owns the
integration, unless the integration is genuinely shared.

Examples:

```text
Open-Meteo
   ↓
flood_engine / twin_aggregator

AI provider
   ↓
news_report / decision-related services
```

For more complex integrations, create:

```text
clients.py
```

inside the relevant service.

Example:

```text
news_report/
├── router.py
├── schemas.py
├── service.py
├── clients.py
└── tests/
```

---

# 15. Background Jobs

Scheduled or long-running jobs should not be placed directly inside
`main.py`.

Use a dedicated worker module or service-specific job implementation.

Example:

```text
flood_engine/
├── router.py
├── schemas.py
├── service.py
├── workers.py
└── tests/
```

Application startup may register the scheduler, but the actual feature logic
belongs to the owning service.

---

# 16. Cross-Feature Communication

Feature services should remain as independent as practical.

Avoid directly importing another service's internal implementation.

Avoid:

```text
sos_service
   ↓
import resource_service.service
```

unless there is a deliberate architectural reason.

When features need to communicate, prefer:

* Shared abstractions.
* Clearly defined service interfaces.
* Database state where appropriate.
* Events / WebSockets for real-time communication.
* Explicit API contracts.

Cross-feature dependencies should be discussed before implementation.

---

# 17. Feature Ownership

Each feature has an owner.

Example:

```text
SOS
→ backend/services/sos_service/

Digital Twin
→ backend/services/twin_aggregator/

Resources
→ backend/services/resource_service/
```

The owner is responsible for the internal implementation of that feature.

Other developers should not modify feature internals without coordination.

---

# 18. Shared vs Feature-Owned Code

### Feature-owned

Generally safe for the feature owner to modify:

```text
backend/services/<their_feature>/
```

### Shared

Requires review:

```text
backend/main.py
backend/shared/
database/schema.sql
database/migrations/
```

The goal is to keep most development inside feature-owned boundaries.

---

# 19. Testing

Each service should eventually have its own tests:

```text
backend/services/<feature>/tests/
```

Tests should cover:

* Service logic.
* API routes.
* Validation.
* Important edge cases.

Shared infrastructure should have its own tests where appropriate.

---

# 20. Five-Person Development Model

The repository is designed around five developers.

Each developer should primarily work within their assigned feature.

Example:

```text
Developer A
→ SOS

Developer B
→ Digital Twin

Developer C
→ Resource / Donation

Developer D
→ Registration / News

Developer E
→ Workforce / Flood Engine
```

The exact ownership can be assigned by the team.

The important rule is that developers should minimize changes outside their
feature boundary.

---

# 21. Branching

Feature branches should follow:

```text
feature/<feature_name>
```

Examples:

```text
feature/sos
feature/digital_twin
feature/resource_service
feature/news_report
```

Shared infrastructure changes should be communicated to the team before
implementation.

---

# 22. Pull Requests

Every feature should be merged through a pull request.

A pull request should clearly state:

* What was implemented.
* What files were changed.
* Whether shared code was modified.
* Whether database schema was modified.
* How the feature was tested.

Changes to shared infrastructure require additional review.

---

# 23. Dependency Direction

The preferred dependency direction is:

```text
API request
    ↓
Router
    ↓
Schema validation
    ↓
Service
    ↓
Repository / client
    ↓
Shared infrastructure
    ↓
Database / external system
```

Avoid circular dependencies.

Keep feature-specific logic inside the feature.

Keep infrastructure-specific logic inside shared infrastructure.

---

# 24. Architecture Goal

The architecture is intentionally modular but not microservices-based.

All features run inside one FastAPI application.

```text
                 FastAPI
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      SOS        Resources     News
        │           │           │
        └───────────┼───────────┘
                    ↓
              Shared Layer
                    ↓
          Supabase / External APIs
```

This gives Sahayak:

* One backend deployment.
* One application entry point.
* Clear feature ownership.
* Lower operational complexity.
* Easier development for a five-person team.

Individual features remain modular internally without creating unnecessary
deployment or infrastructure complexity.

---

# 25. Final Rule

When deciding where new code belongs, ask:

> "Is this logic specific to one feature, or is it genuinely shared?"

If it is feature-specific:

```text
backend/services/<feature>/
```

If it is genuinely shared:

```text
backend/shared/
```

If it changes the database:

```text
database/schema.sql
database/migrations/
```

If it controls application startup or router registration:

```text
backend/main.py
```

This rule should guide architectural decisions throughout development.