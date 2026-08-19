from fastapi import FastAPI

app = FastAPI(
    title="Sahayak API",
    description="Backend API for the Sahayak disaster management platform.",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sahayak-api"}
