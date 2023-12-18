from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, users
from backend.users import users_schema as schemas
from backend.users import users_models as models
from backend.users import utils

users_router = APIRouter()

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@users_router.post("/register", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = utils.hash_password(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, role=user.role)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# @users_router.get("/users/{user_id}", response_model=User)
# def get_user(user_id: int, db: Session = Depends(get_db)):
#     # Add logic to retrieve a user
#     pass

# More endpoints for updating, deleting users and handling job postings
