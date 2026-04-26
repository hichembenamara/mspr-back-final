from __future__ import annotations

from fastapi import APIRouter

from app.db import models
from app.modules import auth, dashboards, me
from app.modules.resources import (
    JournalAlimentaireCreate,
    JournalAlimentaireUpdate,
    ResourceConfig,
    create_crud_router,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(dashboards.router)

RESOURCES = [
    ResourceConfig("/organisations", models.Organisation, "organisation_id"),
    ResourceConfig("/sources-donnees", models.SourceDonnees, "source_id", soft_delete_field="actif", soft_delete_value=False),
    ResourceConfig("/regles-qualite", models.RegleQualite, "regle_id", soft_delete_field="actif", soft_delete_value=False),
    ResourceConfig("/utilisateurs", models.Utilisateur, "utilisateur_id"),
    ResourceConfig("/objectifs-utilisateur", models.ObjectifUtilisateur, "objectif_id", owner_field="utilisateur_id"),
    ResourceConfig("/progression-photos", models.ProgressionPhoto, "photo_id", owner_field="utilisateur_id"),
    ResourceConfig("/mesures-biometriques", models.MesureBiometrique, "mesure_id", owner_field="utilisateur_id"),
    ResourceConfig("/mesures-sommeil-sante", models.MesureSommeilSante, "mesure_sommeil_id", owner_field="utilisateur_id"),
    ResourceConfig("/exercices", models.Exercice, "exercice_id"),
    ResourceConfig("/seances-entrainement", models.SeanceEntrainement, "seance_id", owner_field="utilisateur_id"),
    ResourceConfig("/seances-exercices", models.SeanceExercice, "seance_exercice_id"),
    ResourceConfig("/aliments", models.Aliment, "aliment_id"),
    ResourceConfig("/plats", models.Plat, "plat_id", owner_field="utilisateur_id"),
    ResourceConfig(
        "/journal-alimentaire",
        models.JournalAlimentaire,
        "journal_id",
        owner_field="utilisateur_id",
        create_schema=JournalAlimentaireCreate,
        update_schema=JournalAlimentaireUpdate,
    ),
    ResourceConfig("/executions-etl", models.ExecutionEtl, "execution_id"),
    ResourceConfig("/lots-donnees", models.LotDonnees, "lot_id"),
    ResourceConfig("/enregistrements-bruts", models.EnregistrementBrut, "enregistrement_id"),
    ResourceConfig("/stg-imports", models.StgImport, "stg_id"),
    ResourceConfig("/controles-qualite-donnees", models.ControleQualiteDonnee, "controle_id"),
]

for resource in RESOURCES:
    api_router.include_router(create_crud_router(resource))
