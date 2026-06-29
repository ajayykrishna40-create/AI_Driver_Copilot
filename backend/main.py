from fastapi import FastAPI
from database import engine, Base
import models
from routes import router as driver_router
from agent import router as agent_router
from voice import router as voice_router
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)
app = FastAPI(title="Truck Assistant API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(driver_router)
app.include_router(agent_router)
app.include_router(voice_router)


@app.get("/")
def home():
    return{"message":"Truck AI is working good!!!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

