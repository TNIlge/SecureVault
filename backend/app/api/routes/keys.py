from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_keys():
    return {"status": "not implemented"}

@router.post("/create")
async def create_key():
    return {"status": "not implemented"}
