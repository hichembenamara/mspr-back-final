from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.pagination import PaginationParams, paginated_response, pagination_params
from app.core.security import current_user
from app.db.models import (
    JournalAlimentaire,
    MesureBiometrique,
    MesureSommeilSante,
    ObjectifUtilisateur,
    Plat,
    ProgressionPhoto,
    SeanceEntrainement,
    Utilisateur,
)
from app.db.session import get_db
from app.modules.resources import serialize_model

router = APIRouter(prefix="/me", tags=["me"])

ME_RESOURCES = {
    "objectifs": ObjectifUtilisateur,
    "photos": ProgressionPhoto,
    "mesures-biometriques": MesureBiometrique,
    "sommeil-sante": MesureSommeilSante,
    "seances": SeanceEntrainement,
    "plats": Plat,
    "journal-alimentaire": JournalAlimentaire,
}


def _list_owned(model: type, db: Session, user: Utilisateur, pagination: PaginationParams) -> dict[str, Any]:
    stmt = select(model).where(model.utilisateur_id == user.utilisateur_id)
    pk = list(model.__table__.primary_key.columns)[0]
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(stmt.order_by(pk.desc()).offset(pagination.offset).limit(pagination.page_size)).scalars().all()
    return paginated_response([serialize_model(row) for row in rows], pagination.page, pagination.page_size, int(total))


@router.get("/objectifs")
def objectifs(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(ObjectifUtilisateur, db, user, pagination)


@router.get("/photos")
def photos(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(ProgressionPhoto, db, user, pagination)


@router.get("/mesures-biometriques")
def mesures_biometriques(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(MesureBiometrique, db, user, pagination)


@router.get("/sommeil-sante")
def sommeil_sante(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(MesureSommeilSante, db, user, pagination)


@router.get("/seances")
def seances(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(SeanceEntrainement, db, user, pagination)


@router.get("/plats")
def plats(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(Plat, db, user, pagination)


@router.get("/journal-alimentaire")
def journal_alimentaire(pagination: PaginationParams = Depends(pagination_params), db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)):
    return _list_owned(JournalAlimentaire, db, user, pagination)
