export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiOkPayload<T> = { data: T };

export type PaginatedMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type UserRole = "UTILISATEUR" | "ADMIN" | "SUPER_ADMIN";

export type UserStatut = "ACTIF" | "INACTIF" | "SUSPENDU";

export type Utilisateur = {
  utilisateur_id: number;
  organisation_id: number;
  nom_utilisateur: string;
  email: string;
  role: UserRole;
  statut: UserStatut;
  cree_le?: string;
  modifie_le?: string;
};

export type LoginRequest = {
  identifiant: string;
  mot_de_passe: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
};

