from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from collections.abc import Generator

from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password_pbkdf2_sha256
from app.db.base import Base
from app.db.models import Organisation, Plat, Utilisateur
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def testing_session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with TestingSession() as session:
        org = Organisation(nom="HealthAI Public", adresse="Paris")
        session.add(org)
        session.flush()
        session.add_all(
            [
                Utilisateur(
                    organisation_id=org.organisation_id,
                    nom_utilisateur="alice",
                    email="alice@example.test",
                    role="UTILISATEUR",
                    statut="ACTIF",
                    mot_de_passe_hash=hash_password_pbkdf2_sha256("secret"),
                ),
                Utilisateur(
                    organisation_id=org.organisation_id,
                    nom_utilisateur="admin",
                    email="admin@example.test",
                    role="ADMIN",
                    statut="ACTIF",
                    mot_de_passe_hash=hash_password_pbkdf2_sha256("admin-secret"),
                ),
            ]
        )
        session.commit()
    return TestingSession


@pytest.fixture()
def db_session(testing_session_factory: sessionmaker[Session]) -> Generator[Session, None, None]:
    with testing_session_factory() as session:
        yield session


@pytest.fixture()
def client(testing_session_factory: sessionmaker[Session]) -> TestClient:
    def override_get_db():
        with testing_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def login(client: TestClient, identifiant: str, mot_de_passe: str) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"identifiant": identifiant, "mot_de_passe": mot_de_passe},
    )
    assert response.status_code == 200
    return response.json()


def auth_headers(client: TestClient, identifiant: str = "admin", password: str = "admin-secret") -> dict[str, str]:
    token = login(client, identifiant, password)["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_me_and_refresh_use_french_contract(client: TestClient):
    login_payload = login(client, "alice", "secret")

    assert login_payload["data"]["token_type"] == "bearer"
    assert "refresh_token" in client.cookies

    headers = {"Authorization": f"Bearer {login_payload['data']['access_token']}"}
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["data"]["nom_utilisateur"] == "alice"

    refreshed = client.post("/api/auth/refresh")
    assert refreshed.status_code == 200
    assert refreshed.json()["data"]["token_type"] == "bearer"


def test_collection_response_is_paginated(client: TestClient):
    response = client.get("/api/organisations?page=1&page_size=1", headers=auth_headers(client))

    assert response.status_code == 200
    body = response.json()
    assert list(body.keys()) == ["data", "meta"]
    assert body["meta"] == {"page": 1, "page_size": 1, "total": 1, "total_pages": 1}


def test_role_guard_blocks_regular_user_from_admin_dashboard(client: TestClient):
    response = client.get("/api/admin/dashboard", headers=auth_headers(client, "alice", "secret"))

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_me_routes_are_scoped_to_authenticated_user(client: TestClient, db_session: Session):
    alice = db_session.query(Utilisateur).filter_by(nom_utilisateur="alice").one()
    admin = db_session.query(Utilisateur).filter_by(nom_utilisateur="admin").one()
    db_session.add_all(
        [
            Plat(utilisateur_id=alice.utilisateur_id, consomme_le=datetime.now(timezone.utc), type_repas="DEJEUNER"),
            Plat(utilisateur_id=admin.utilisateur_id, consomme_le=datetime.now(timezone.utc), type_repas="DINER"),
        ]
    )
    db_session.commit()

    response = client.get("/api/me/plats", headers=auth_headers(client, "alice", "secret"))

    assert response.status_code == 200
    rows = response.json()["data"]
    assert len(rows) == 1
    assert rows[0]["utilisateur_id"] == alice.utilisateur_id


def test_journal_alimentaire_creation_requires_plat_xor_aliment(client: TestClient, db_session: Session):
    alice = db_session.query(Utilisateur).filter_by(nom_utilisateur="alice").one()

    response = client.post(
        "/api/journal-alimentaire",
        headers=auth_headers(client),
        json={
            "utilisateur_id": alice.utilisateur_id,
            "consomme_le": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "type_repas": "DEJEUNER",
            "plat_id": 1,
            "aliment_id": 1,
        },
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_delete_returns_conflict_when_dependencies_exist(client: TestClient, db_session: Session):
    alice = db_session.query(Utilisateur).filter_by(nom_utilisateur="alice").one()
    db_session.add(Plat(utilisateur_id=alice.utilisateur_id, consomme_le=datetime.now(timezone.utc), type_repas="DEJEUNER"))
    db_session.commit()

    response = client.delete(f"/api/utilisateurs/{alice.utilisateur_id}", headers=auth_headers(client))

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"
