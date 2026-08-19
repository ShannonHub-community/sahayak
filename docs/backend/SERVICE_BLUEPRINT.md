# Sahayak Backend Service Blueprint

## Purpose

Every Sahayak backend feature should follow a consistent service structure.

The goal is to allow five developers to work on separate features without
creating unnecessary coupling or inconsistent backend patterns.

---

## Standard Service Structure

```text
backend/services/<feature_name>/
├── __init__.py
├── router.py
├── schemas.py
├── service.py
└── tests/
    └── __init__.py
````

Additional files may be added when the feature genuinely requires them.

Examples:

```text
repository.py
models.py
utils.py
clients.py
workers.py
```

Do not add files merely to make the folder look complete.

---

## File Responsibilities

### `__init__.py`

Marks the feature directory as a Python package.

Keep this file minimal.

Do not put business logic here.

---

### `router.py`

Contains the FastAPI API routes for the feature.

Responsibilities:

* Define API endpoints.
* Receive HTTP requests.
* Validate input through Pydantic schemas.
* Call functions from `service.py`.
* Return API responses.

The router should remain thin.

Do not put substantial business logic inside route handlers.

---

### `schemas.py`

Contains Pydantic request and response models.

Responsibilities:

* Request validation.
* Response structure.
* Data transfer models.

Keep database queries and business logic out of this file.

---

### `service.py`

Contains the feature's business logic.

Responsibilities:

* Process feature operations.
* Coordinate database operations.
* Call external APIs when required.
* Apply feature-specific rules.
* Coordinate with shared infrastructure.

The router should call the service layer instead of implementing business logic itself.

---

### `tests/`

Contains tests belonging to that feature.

Tests should remain close to the feature they validate.

As the feature grows, this directory can contain:

```text
tests/
├── __init__.py
├── test_router.py
└── test_service.py
```

---

## Optional Files

Additional files are allowed when complexity requires them.

### `repository.py`

Use when database access becomes substantial enough to separate from business logic.

Preferred flow:

```text
router
   ↓
service
   ↓
repository
   ↓
database
```

Do not create a repository layer for trivial database operations.

---

### `models.py`

Use when the feature needs dedicated domain models that are different from
API request/response schemas.

Do not duplicate models unnecessarily.

---

### `clients.py`

Use for external service integrations.

Examples:

* Open-Meteo
* CWC data source
* AI provider
* Future SMS gateway

---

### `workers.py`

Use for background processing or scheduled jobs when required.

---

## Dependency Direction

The preferred dependency direction is:

```text
Router
  ↓
Service
  ↓
Repository / external clients
  ↓
Shared infrastructure
  ↓
External systems / database
```

Avoid circular dependencies.

A service should not import another service's internal implementation directly
unless the architecture explicitly requires it.

Prefer shared abstractions or clearly defined interfaces for cross-feature
integration.

---

## Shared Backend Rules

The following areas are shared:

```text
backend/main.py
backend/shared/
database/schema.sql
```

Changes to these areas require review.

Feature developers should not modify shared infrastructure casually.

---

## `main.py` Rule

`backend/main.py` is the application entry point.

It should primarily:

* Create the FastAPI application.
* Configure application-wide middleware.
* Configure application-wide startup/shutdown behavior.
* Register feature routers.
* Expose application-level health checks.

It should NOT contain feature business logic.

Feature implementation belongs inside:

```text
backend/services/
```

---

## Feature Ownership

Each feature should primarily stay inside its assigned service folder.

Example:

```text
SOS owner
→ backend/services/sos_service/
```

A feature owner should not modify another feature's internal implementation
without coordination and review.

---

## Naming Convention

Use `snake_case` for backend directories and Python modules.

Examples:

```text
sos_service
twin_aggregator
resource_service
donation_service
```

Do not introduce alternate spellings for the same feature.

---

## Minimal Service Principle

Start with:

```text
__init__.py
router.py
schemas.py
service.py
tests/
```

Add complexity only when the feature needs it.

This keeps the codebase understandable while allowing individual services
to grow independently.

