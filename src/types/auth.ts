export type UserRole = "administrador" | "mesero" | "cajero";

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  mesero: "Mesero",
  cajero: "Cajero",
};

export const ROLE_PERMISSIONS = {
  administrador: {
    productos_editar: true,
    sync_fudo: true,
    delivery_config: true,
    checklist_marcar: true,
    media_subir: true,
    gestion_usuarios: true,
  },
  mesero: {
    productos_editar: false,
    sync_fudo: false,
    delivery_config: false,
    checklist_marcar: true,
    media_subir: false,
    gestion_usuarios: false,
  },
  cajero: {
    productos_editar: false,
    sync_fudo: false,
    delivery_config: false,
    checklist_marcar: false,
    media_subir: false,
    gestion_usuarios: false,
  },
} as const;
