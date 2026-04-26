from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifiant: str = Field(min_length=1)
    mot_de_passe: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LogoutResponse(BaseModel):
    message: str
