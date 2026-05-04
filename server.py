"""
FastAPI обёртка для всех cloud-функций из /backend.
Запускает каждую папку в /backend как HTTP-эндпоинт /api/{имя_папки}.
Совместима с форматом poehali (event/context).
"""
import os
import sys
import json
import importlib.util
import traceback
from pathlib import Path
from typing import Any, Dict
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

BACKEND_DIR = Path(__file__).parent / "backend"

app = FastAPI(title="Florarium API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FakeContext:
    def __init__(self, request_id: str = "local"):
        self.request_id = request_id
        self.function_name = "local"
        self.function_version = "1.0"
        self.memory_limit_in_mb = 512


def load_handler(func_name: str):
    """Динамически загружает handler из backend/{func_name}/index.py"""
    func_path = BACKEND_DIR / func_name / "index.py"
    if not func_path.exists():
        return None
    spec = importlib.util.spec_from_file_location(f"backend.{func_name}", func_path)
    module = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(BACKEND_DIR / func_name))
    try:
        spec.loader.exec_module(module)
    finally:
        sys.path.pop(0)
    return getattr(module, "handler", None)


async def build_event(request: Request) -> Dict[str, Any]:
    body_bytes = await request.body()
    try:
        body_str = body_bytes.decode("utf-8")
    except UnicodeDecodeError:
        import base64
        body_str = base64.b64encode(body_bytes).decode("ascii")

    headers = dict(request.headers)
    if "authorization" in headers:
        headers["X-Authorization"] = headers["authorization"]
    if "cookie" in headers:
        headers["X-Cookie"] = headers["cookie"]

    qs = dict(request.query_params)

    return {
        "httpMethod": request.method,
        "headers": headers,
        "queryStringParameters": qs if qs else None,
        "body": body_str,
        "isBase64Encoded": False,
        "requestContext": {
            "identity": {
                "sourceIp": request.client.host if request.client else "0.0.0.0"
            }
        },
    }


@app.api_route("/api/{func_name}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
async def proxy(func_name: str, request: Request):
    handler = load_handler(func_name)
    if handler is None:
        return JSONResponse({"error": f"Function '{func_name}' not found"}, status_code=404)

    event = await build_event(request)
    ctx = FakeContext(request_id=request.headers.get("x-request-id", "local"))

    try:
        result = handler(event, ctx)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": "Internal error", "details": str(e)}, status_code=500)

    status = result.get("statusCode", 200)
    headers = result.get("headers", {}) or {}
    body = result.get("body", "")

    if "x-set-cookie" in {k.lower() for k in headers}:
        for k in list(headers.keys()):
            if k.lower() == "x-set-cookie":
                headers["Set-Cookie"] = headers.pop(k)

    if result.get("isBase64Encoded"):
        import base64
        return Response(content=base64.b64decode(body), status_code=status, headers=headers)

    return Response(content=body, status_code=status, headers=headers, media_type=headers.get("Content-Type", "application/json"))


@app.get("/")
def root():
    return {"status": "ok", "service": "florarium-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
