from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, ConfigDict, Field, create_model, model_validator
from sqlalchemy import Column, Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ApiError
from app.core.pagination import PaginationParams, paginated_response, pagination_params
from app.core.security import current_user, require_roles
from app.db.models import Utilisateur
from app.db.session import get_db


CRUD_ROLES = ("ADMIN", "SUPER_ADMIN")


@dataclass(frozen=True)
class ResourceConfig:
    path: str
    model: type
    pk: str
    owner_field: str | None = None
    soft_delete_field: str | None = None
    soft_delete_value: Any = None
    create_schema: type[BaseModel] | None = None
    update_schema: type[BaseModel] | None = None


def serialize_model(obj: Any, hide_sensitive: bool = True) -> dict[str, Any]:
    data = {column.name: getattr(obj, column.name) for column in obj.__table__.columns}
    if hide_sensitive:
        data.pop("mot_de_passe_hash", None)
    return data


def _python_type(column: Column[Any]) -> type[Any]:
    try:
        py_type = column.type.python_type
    except NotImplementedError:
        py_type = str
    return py_type


def build_schema(name: str, model: type, *, partial: bool) -> type[BaseModel]:
    fields: dict[str, tuple[Any, Any]] = {}
    for column in model.__table__.columns:
        if column.primary_key or column.name in {"cree_le", "modifie_le", "mot_de_passe_hash"}:
            continue
        py_type = _python_type(column)
        annotation = py_type | None
        default = None if partial or column.nullable or column.default is not None else ...
        fields[column.name] = (annotation, default)

    return create_model(
        name,
        __config__=ConfigDict(extra="forbid", from_attributes=True),
        **fields,
    )


class JournalAlimentaireCreate(BaseModel):
    utilisateur_id: int
    plat_id: int | None = None
    aliment_id: int | None = None
    source_id: int | None = None
    lot_id: int | None = None
    consomme_le: datetime
    type_repas: str | None = None
    aliment_nom_libre: str | None = None
    quantite: float | None = None
    unite_quantite: str | None = None
    calories_kcal: float | None = None
    eau_ml: float | None = None

    @model_validator(mode="after")
    def validate_reference(self) -> "JournalAlimentaireCreate":
        if (self.plat_id is None) == (self.aliment_id is None):
            raise ValueError("Une ligne doit referencer soit un plat, soit un aliment.")
        return self


class JournalAlimentaireUpdate(BaseModel):
    utilisateur_id: int | None = None
    plat_id: int | None = None
    aliment_id: int | None = None
    source_id: int | None = None
    lot_id: int | None = None
    consomme_le: datetime | None = None
    type_repas: str | None = None
    aliment_nom_libre: str | None = None
    quantite: float | None = None
    unite_quantite: str | None = None
    calories_kcal: float | None = None
    eau_ml: float | None = None

    @model_validator(mode="after")
    def validate_reference(self) -> "JournalAlimentaireUpdate":
        if self.plat_id is not None and self.aliment_id is not None:
            raise ValueError("Une ligne doit referencer soit un plat, soit un aliment.")
        return self


class SeanceCompleteCreate(BaseModel):
    utilisateur_id: int
    source_id: int | None = None
    lot_id: int | None = None
    date_seance: datetime
    type_entrainement: str | None = None
    duree_seance_min: int | None = None
    calories_brulees_total: float | None = None
    frequence_entrainement_j_sem: int | None = None
    niveau_experience: str | None = None
    eau_l: float | None = None
    exercices: list[dict[str, Any]] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_details(self) -> "SeanceCompleteCreate":
        if "exercices" in self.model_fields_set and not self.exercices:
            raise ValueError("Une seance creee avec detail complet doit contenir au moins un exercice.")
        return self


def _base_query(model: type, owner_field: str | None, user: Utilisateur) -> Select[Any]:
    stmt = select(model)
    if owner_field and user.role == "UTILISATEUR":
        stmt = stmt.where(getattr(model, owner_field) == user.utilisateur_id)
    return stmt


def create_crud_router(config: ResourceConfig) -> APIRouter:
    router = APIRouter(prefix=config.path, tags=[config.path.strip("/")])
    create_schema = config.create_schema or build_schema(f"{config.model.__name__}Create", config.model, partial=False)
    update_schema = config.update_schema or build_schema(f"{config.model.__name__}Update", config.model, partial=True)
    pk_column = getattr(config.model, config.pk)

    @router.get("")
    def list_items(
        pagination: PaginationParams = Depends(pagination_params),
        db: Session = Depends(get_db),
        user: Utilisateur = Depends(current_user),
    ) -> dict[str, Any]:
        stmt = _base_query(config.model, config.owner_field, user)
        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
        rows = db.execute(stmt.order_by(pk_column.desc()).offset(pagination.offset).limit(pagination.page_size)).scalars().all()
        return paginated_response(
            [serialize_model(row) for row in rows],
            pagination.page,
            pagination.page_size,
            int(total),
        )

    @router.get("/{item_id}")
    def get_item(
        item_id: int,
        db: Session = Depends(get_db),
        user: Utilisateur = Depends(current_user),
    ) -> dict[str, Any]:
        item = db.get(config.model, item_id)
        if not item:
            raise ApiError(404, "not_found", "Ressource introuvable.")
        if config.owner_field and user.role == "UTILISATEUR" and getattr(item, config.owner_field) != user.utilisateur_id:
            raise ApiError(403, "forbidden", "Acces refuse a cette ressource.")
        return {"data": serialize_model(item)}

    @router.post("", status_code=201)
    def create_item(
        payload: create_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: Utilisateur = Depends(require_roles(*CRUD_ROLES)),
    ) -> dict[str, Any]:
        data = payload.model_dump(exclude_unset=True)
        data.setdefault("cree_le", datetime.utcnow())
        item = config.model(**data)
        try:
            db.add(item)
            db.commit()
            db.refresh(item)
        except IntegrityError:
            db.rollback()
            raise
        return {"data": serialize_model(item)}

    @router.patch("/{item_id}")
    def update_item(
        item_id: int,
        payload: update_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: Utilisateur = Depends(require_roles(*CRUD_ROLES)),
    ) -> dict[str, Any]:
        item = db.get(config.model, item_id)
        if not item:
            raise ApiError(404, "not_found", "Ressource introuvable.")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        if hasattr(item, "modifie_le"):
            item.modifie_le = datetime.utcnow()
        db.commit()
        db.refresh(item)
        return {"data": serialize_model(item)}

    @router.put("/{item_id}")
    def replace_item(
        item_id: int,
        payload: create_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: Utilisateur = Depends(require_roles(*CRUD_ROLES)),
    ) -> dict[str, Any]:
        item = db.get(config.model, item_id)
        if not item:
            raise ApiError(404, "not_found", "Ressource introuvable.")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        if hasattr(item, "modifie_le"):
            item.modifie_le = datetime.utcnow()
        db.commit()
        db.refresh(item)
        return {"data": serialize_model(item)}

    @router.delete("/{item_id}", status_code=204)
    def delete_item(
        item_id: int,
        response: Response,
        db: Session = Depends(get_db),
        _: Utilisateur = Depends(require_roles(*CRUD_ROLES)),
    ) -> None:
        item = db.get(config.model, item_id)
        if not item:
            raise ApiError(404, "not_found", "Ressource introuvable.")
        if _has_blocking_dependencies(db, config.model, config.pk, item_id):
            if config.soft_delete_field:
                setattr(item, config.soft_delete_field, config.soft_delete_value)
                db.commit()
                response.status_code = 200
                return None
            raise ApiError(409, "conflict", "Suppression refusee: dependances existantes.")
        db.delete(item)
        db.commit()
        return None

    return router


def _has_blocking_dependencies(db: Session, model: type, pk: str, value: int) -> bool:
    for table in model.metadata.sorted_tables:
        if table.name == model.__tablename__:
            continue
        for fk in table.foreign_keys:
            if fk.column.table.name == model.__tablename__ and fk.column.name == pk:
                exists_stmt = select(table.c[fk.parent.name]).where(table.c[fk.parent.name] == value).limit(1)
                if db.execute(exists_stmt).first() is not None:
                    return True
    return False
