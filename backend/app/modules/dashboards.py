from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import current_user, require_roles
from app.db.models import (
    Aliment,
    ControleQualiteDonnee,
    ExecutionEtl,
    JournalAlimentaire,
    MesureBiometrique,
    MesureSommeilSante,
    Plat,
    SeanceEntrainement,
    Utilisateur,
)
from app.db.session import get_db

router = APIRouter(tags=["dashboards"])


@router.get("/me/dashboard")
def me_dashboard(db: Session = Depends(get_db), user: Utilisateur = Depends(current_user)) -> dict:
    uid = user.utilisateur_id
    latest_bio = db.execute(
        select(MesureBiometrique).where(MesureBiometrique.utilisateur_id == uid).order_by(MesureBiometrique.mesure_le.desc())
    ).scalars().first()
    latest_sleep = db.execute(
        select(MesureSommeilSante)
        .where(MesureSommeilSante.utilisateur_id == uid)
        .order_by(MesureSommeilSante.mesure_le.desc())
    ).scalars().first()
    return {
        "data": {
            "utilisateur_id": uid,
            "dernier_poids_kg": None if not latest_bio else latest_bio.poids_kg,
            "dernier_imc": None if not latest_bio else latest_bio.imc,
            "derniere_duree_sommeil_h": None if not latest_sleep else latest_sleep.duree_sommeil_h,
            "nb_seances": db.scalar(select(func.count()).where(SeanceEntrainement.utilisateur_id == uid)) or 0,
            "nb_plats": db.scalar(select(func.count()).where(Plat.utilisateur_id == uid)) or 0,
            "calories_journal": db.scalar(
                select(func.coalesce(func.sum(JournalAlimentaire.calories_kcal), 0)).where(JournalAlimentaire.utilisateur_id == uid)
            )
            or 0,
        }
    }


@router.get("/admin/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> dict:
    return {
        "data": {
            "nb_utilisateurs": db.scalar(select(func.count()).select_from(Utilisateur)) or 0,
            "nb_aliments": db.scalar(select(func.count()).select_from(Aliment)) or 0,
            "nb_executions_etl": db.scalar(select(func.count()).select_from(ExecutionEtl)) or 0,
            "taux_qualite_moyen": db.scalar(select(func.avg(ExecutionEtl.taux_qualite))) or 0,
            "controles_bloquants": db.scalar(
                select(func.count()).where(ControleQualiteDonnee.est_bloquant.is_(True))
            )
            or 0,
        }
    }


@router.get("/super-admin/dashboard")
def super_admin_dashboard(
    db: Session = Depends(get_db),
    _: Utilisateur = Depends(require_roles("SUPER_ADMIN")),
) -> dict:
    return {
        "data": {
            "nb_utilisateurs": db.scalar(select(func.count()).select_from(Utilisateur)) or 0,
            "nb_admins": db.scalar(select(func.count()).where(Utilisateur.role.in_(["ADMIN", "SUPER_ADMIN"]))) or 0,
            "nb_executions_etl": db.scalar(select(func.count()).select_from(ExecutionEtl)) or 0,
            "qualite_min": db.scalar(select(func.min(ExecutionEtl.taux_qualite))) or 0,
            "qualite_max": db.scalar(select(func.max(ExecutionEtl.taux_qualite))) or 0,
        }
    }
