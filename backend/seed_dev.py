from __future__ import annotations

import os
import time
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from app.core.security import hash_password_pbkdf2_sha256
from app.db.base import Base
from app.db.models import Organisation, Utilisateur
from app.db.session import get_engine, get_session_factory


def _wait_for_db(max_seconds: int = 60) -> None:
    engine = get_engine()
    deadline = time.time() + max_seconds
    last_exc: Exception | None = None
    while time.time() < deadline:
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
            return
        except OperationalError as exc:
            last_exc = exc
            time.sleep(2)
    raise RuntimeError(f"DB not ready after {max_seconds}s") from last_exc


def _upsert_user(
    *,
    organisation_id: int,
    nom_utilisateur: str,
    email: str,
    role: str,
    password_clear: str,
) -> None:
    SessionLocal = get_session_factory()
    now = datetime.utcnow()
    with SessionLocal() as db:
        user = db.execute(
            select(Utilisateur).where(Utilisateur.nom_utilisateur == nom_utilisateur)
        ).scalar_one_or_none()
        if user is None:
            user = Utilisateur(
                organisation_id=organisation_id,
                nom_utilisateur=nom_utilisateur,
                email=email,
                genre="Inconnu",
                role=role,
                statut="ACTIF",
                mot_de_passe_hash=hash_password_pbkdf2_sha256(password_clear),
                cree_le=now,
                modifie_le=now,
            )
            db.add(user)
        else:
            user.organisation_id = organisation_id
            user.email = email
            user.role = role
            user.statut = "ACTIF"
            user.mot_de_passe_hash = hash_password_pbkdf2_sha256(password_clear)
            user.modifie_le = now
        db.commit()


def main() -> None:
    print("[seed] waiting for database…")
    _wait_for_db(max_seconds=int(os.getenv("SEED_DB_WAIT_SECONDS", "90")))

    engine = get_engine()
    print("[seed] creating tables…")
    Base.metadata.create_all(engine)

    SessionLocal = get_session_factory()
    with SessionLocal() as db:
        org = db.execute(select(Organisation).where(Organisation.nom == "HealthAI Public")).scalar_one_or_none()
        if org is None:
            org = Organisation(nom="HealthAI Public", adresse="Paris", cree_le=datetime.utcnow())
            db.add(org)
            db.commit()
            db.refresh(org)

        organisation_id = int(org.organisation_id)

    print("[seed] upserting dev users…")
    _upsert_user(
        organisation_id=organisation_id,
        nom_utilisateur=os.getenv("SEED_USER_USERNAME", "alice"),
        email=os.getenv("SEED_USER_EMAIL", "alice@example.test"),
        role="UTILISATEUR",
        password_clear=os.getenv("SEED_USER_PASSWORD", "salut"),
    )
    _upsert_user(
        organisation_id=organisation_id,
        nom_utilisateur=os.getenv("SEED_ADMIN_USERNAME", "admin"),
        email=os.getenv("SEED_ADMIN_EMAIL", "admin@example.test"),
        role="ADMIN",
        password_clear=os.getenv("SEED_ADMIN_PASSWORD", "salut"),
    )
    _upsert_user(
        organisation_id=organisation_id,
        nom_utilisateur=os.getenv("SEED_SUPERADMIN_USERNAME", "superadmin"),
        email=os.getenv("SEED_SUPERADMIN_EMAIL", "superadmin@example.test"),
        role="SUPER_ADMIN",
        password_clear=os.getenv("SEED_SUPERADMIN_PASSWORD", "salut"),
    )

    print("[seed] done.")


if __name__ == "__main__":
    main()

