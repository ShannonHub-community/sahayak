import traceback
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from services.twin_aggregator.service import (
    manager,
    get_current_map_state,
    start_background_tasks,
    stop_background_tasks,
)

router = APIRouter(
    prefix="/api/twin_aggregator",
    tags=["twin_aggregator"],
)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for Next.js clients to subscribe to real-time map state diffs.
    """
    await websocket.accept()
    try:
        await manager.connect(websocket)

        # Send the current full map state snapshot as an initial 'added' list.
        current_state = get_current_map_state()
        initial_diff = {
            "added": list(current_state.values()),
            "updated": [],
            "removed": []
        }

        # Use jsonable_encoder to safely serialize datetime, UUID, and geography
        # objects that Python's default json module cannot handle natively.
        await websocket.send_json(jsonable_encoder(initial_diff))

        while True:
            # We keep the connection alive and handle client disconnects.
            # Client messages are discarded since this is a one-way broadcast.
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print("[WebSocket ERROR] Unhandled exception in websocket_endpoint:")
        print(traceback.format_exc())
        manager.disconnect(websocket)


@router.on_event("startup")
async def on_startup():
    """
    Start the background listener task when the router starts.
    """
    await start_background_tasks()


@router.on_event("shutdown")
async def on_shutdown():
    """
    Stop the background listener task when the router shuts down.
    """
    await stop_background_tasks()
