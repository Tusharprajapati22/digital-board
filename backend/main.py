# import os
# from typing import Optional

# from dotenv import load_dotenv
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from supabase import create_client

# load_dotenv()

# TABLE = BUCKET = "Digitalboard"
# sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# app = FastAPI(title="College Digital Board API")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# class NoticeIn(BaseModel):
#     subject: str
#     title: str
#     file_url: str
#     file_name: Optional[str] = None
#     file_type: Optional[str] = None
#     view_password: Optional[str] = None


# class NoticeUpdate(BaseModel):
#     subject: Optional[str] = None
#     title: Optional[str] = None
#     view_password: Optional[str] = None  # "" removes the password


# @app.get("/")
# def health():
#     return {"status": "ok", "service": "College Digital Board API"}


# @app.post("/api/digitalboard", status_code=201)
# def create_notice(body: NoticeIn):
#     data = body.model_dump()
#     data["view_password"] = data["view_password"] or None
#     return sb.table(TABLE).insert(data).execute().data[0]


# @app.get("/api/digitalboard")
# def list_notices():
#     return sb.table(TABLE).select("*").order("created_at", desc=True).execute().data


# @app.put("/api/Digitalboard/{notice_id}")
# def update_notice(notice_id: int, body: NoticeUpdate):
#     changes = body.model_dump(exclude_unset=True)
#     if "view_password" in changes:
#         changes["view_password"] = changes["view_password"] or None
#     if not changes:
#         raise HTTPException(400, "Nothing to update")
#     res = sb.table(TABLE).update(changes).eq("id", notice_id).execute()
#     if not res.data:
#         raise HTTPException(404, "Notice not found")
#     return res.data[0]


# @app.delete("/api/Digitalboard/{notice_id}")
# def delete_notice(notice_id: int):
#     found = sb.table(TABLE).select("file_url").eq("id", notice_id).execute()
#     if not found.data:
#         raise HTTPException(404, "Notice not found")
#     sb.table(TABLE).delete().eq("id", notice_id).execute()
#     try:  # best-effort: also remove the stored file
#         path = found.data[0]["file_url"].split(f"/{BUCKET}/")[-1]
#         sb.storage.from_(BUCKET).remove([path])
#     except Exception:
#         pass
#     return {"deleted": notice_id}


import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

load_dotenv()

TABLE = BUCKET = "Digitalboard"
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

app = FastAPI(title="College Digital Board API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class NoticeIn(BaseModel):
    subject: str
    title: str
    file_url: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    view_password: Optional[str] = None


class NoticeUpdate(BaseModel):
    subject: Optional[str] = None
    title: Optional[str] = None
    view_password: Optional[str] = None  # "" removes the password


@app.get("/")
def health():
    return {"status": "ok", "service": "College Digital Board API"}


@app.post("/api/digitalboard", status_code=201)
def create_notice(body: NoticeIn):
    data = body.model_dump()
    data["view_password"] = data["view_password"] or None
    return sb.table(TABLE).insert(data).execute().data[0]


@app.get("/api/digitalboard")
def list_notices():
    return sb.table(TABLE).select("*").order("created_at", desc=True).execute().data


@app.put("/api/Digitalboard/{notice_id}")
def update_notice(notice_id: int, body: NoticeUpdate):
    changes = body.model_dump(exclude_unset=True)
    if "view_password" in changes:
        changes["view_password"] = changes["view_password"] or None
    if not changes:
        raise HTTPException(400, "Nothing to update")
    res = sb.table(TABLE).update(changes).eq("id", notice_id).execute()
    if not res.data:
        raise HTTPException(404, "Document not found")
    return res.data[0]


@app.delete("/api/Digitalboard/{notice_id}")
def delete_notice(notice_id: int):
    found = sb.table(TABLE).select("file_url").eq("id", notice_id).execute()
    if not found.data:
        raise HTTPException(404, "Document not found")
    sb.table(TABLE).delete().eq("id", notice_id).execute()
    try:  # best-effort: also remove the stored file
        path = found.data[0]["file_url"].split(f"/{BUCKET}/")[-1]
        sb.storage.from_(BUCKET).remove([path])
    except Exception:
        pass
    return {"deleted": notice_id}