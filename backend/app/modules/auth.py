from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.security import (
    authenticate_user,
    create_token,
    current_user,
    current_user_from_refresh,
)
from app.db.models import Utilisateur
from app.db.session import get_db
from app.modules.resources import serialize_model
from app.schemas.auth import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: Utilisateur) -> dict:
    settings = get_settings()
    token = create_token(
        str(user.utilisateur_id),
        "access",
        timedelta(minutes=settings.access_token_minutes),
        {"role": user.role},
    )
    return {"data": {"access_token": token, "token_type": "bearer"}}


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> dict:
    user = authenticate_user(db, payload.identifiant, payload.mot_de_passe)
    if not user:
        raise ApiError(401, "unauthorized", "Identifiants invalides.")
    settings = get_settings()
    refresh_token = create_token(
        str(user.utilisateur_id),
        "refresh",
        timedelta(days=settings.refresh_token_days),
        {"role": user.role},
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="strict",
        max_age=settings.refresh_token_days * 24 * 60 * 60,
    )
    return _token_response(user)


@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie("refresh_token")
    return {"data": {"message": "Deconnexion effectuee."}}


@router.post("/refresh")
def refresh(user: Utilisateur = Depends(current_user_from_refresh)) -> dict:
    return _token_response(user)


@router.get("/me")
def me(user: Utilisateur = Depends(current_user)) -> dict:
    return {"data": serialize_model(user)}
