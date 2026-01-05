export type RegisterRequest = {
  email: string;
  nombre: string;
  telefono?: string;
  password: string;
  empresa_id?: string;
  empresa_nombre?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type UserDTO = {
  id: string;
  email: string;
  nombre: string;
  telefono?: string | null;
};

export type EmpresaDTO = {
  id: string;
  nombre: string;
  rol_id: string;
  rol_nombre: string;
  logo_url?: string | null;
  logo?: string | null;
};

export type AuthRegisterResponse = {
  user: UserDTO;
  empresas: EmpresaDTO[];
  access_token: string;
  empresa_activa_id?: string | null;
};

export type AuthLoginResponse = {
  user: UserDTO;
  empresas: EmpresaDTO[];
  access_token: string;
  empresa_activa_id?: string | null;
};

export type GanadexSession = {
  user: UserDTO;
  empresas: EmpresaDTO[];
  empresa_activa_id: string | null;
};
