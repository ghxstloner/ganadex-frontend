"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import NoPermission from "@/components/no-permission";
import {
  activateUser,
  changeUserRole,
  createUser,
  deactivateUser,
  fetchRoles,
  fetchUsers,
  inviteUser,
  removeUser,
  updateUser,
} from "@/lib/api/admin.service";
import type { RoleDTO, UserAdminDTO } from "@/lib/types/admin";

const createUserSchema = z.object({
  nombre: z.string().min(2, "Ingresa el nombre"),
  email: z.string().email("Email invalido"),
  rolId: z.string().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email("Email invalido"),
  rolId: z.string().optional(),
});

const editUserSchema = z.object({
  nombre: z.string().min(2, "Ingresa el nombre"),
  email: z.string().email("Email invalido"),
});

const changeRoleSchema = z.object({
  rolId: z.string().min(1, "Selecciona un rol"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type InviteUserForm = z.infer<typeof inviteUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;
type ChangeRoleForm = z.infer<typeof changeRoleSchema>;

function statusLabel(user: UserAdminDTO) {
  return user.estado === "inactivo" ? "Inactivo" : "Activo";
}

function statusClasses(user: UserAdminDTO) {
  return user.estado === "inactivo"
    ? "bg-muted text-muted-foreground"
    : "bg-emerald-100 text-emerald-700";
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserAdminDTO[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<
    "deactivate" | "activate" | "remove" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<UserAdminDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { nombre: "", email: "", rolId: "" },
  });

  const inviteForm = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", rolId: "" },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { nombre: "", email: "" },
  });

  const roleForm = useForm<ChangeRoleForm>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: { rolId: "" },
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.nombre, user.email].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [users, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetchUsers({ toastOnError: false }),
        fetchRoles({ toastOnError: false }),
      ]);
      setUsers(usersResponse);
      setRoles(rolesResponse);
      setForbidden(false);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 403) {
        setForbidden(true);
      } else {
        toast.error("No se pudieron cargar los usuarios");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (user: UserAdminDTO) => {
    setSelectedUser(user);
    editForm.reset({ nombre: user.nombre, email: user.email });
    setEditOpen(true);
  };

  const openChangeRole = (user: UserAdminDTO) => {
    setSelectedUser(user);
    roleForm.reset({ rolId: user.rol_id ?? "" });
    setRoleOpen(true);
  };

  const openConfirm = (
    user: UserAdminDTO,
    mode: "deactivate" | "activate" | "remove"
  ) => {
    setSelectedUser(user);
    setConfirmMode(mode);
    setConfirmOpen(true);
  };

  const handleCreate = async (values: CreateUserForm) => {
    setSubmitting(true);
    try {
      const payload = {
        nombre: values.nombre,
        email: values.email,
        rol_id: values.rolId || null,
      };
      const created = await createUser(payload);
      setUsers((prev) => [created, ...prev]);
      toast.success("Usuario creado");
      setCreateOpen(false);
      createForm.reset();
    } catch {
      toast.error("No se pudo crear el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (values: InviteUserForm) => {
    setSubmitting(true);
    try {
      const payload = {
        email: values.email,
        rol_id: values.rolId || null,
      };
      const invited = await inviteUser(payload);
      setUsers((prev) => [invited, ...prev]);
      toast.success("Invitacion enviada");
      setInviteOpen(false);
      inviteForm.reset();
    } catch {
      toast.error("No se pudo invitar al usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: EditUserForm) => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const updated = await updateUser(selectedUser.id, values);
      setUsers((prev) =>
        prev.map((user) => (user.id === updated.id ? updated : user))
      );
      toast.success("Usuario actualizado");
      setEditOpen(false);
    } catch {
      toast.error("No se pudo actualizar el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (values: ChangeRoleForm) => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const updated = await changeUserRole(selectedUser.id, values.rolId);
      setUsers((prev) =>
        prev.map((user) => (user.id === updated.id ? updated : user))
      );
      toast.success("Rol actualizado");
      setRoleOpen(false);
    } catch {
      toast.error("No se pudo cambiar el rol");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedUser || !confirmMode) return;
    setSubmitting(true);
    try {
      if (confirmMode === "deactivate") {
        const updated = await deactivateUser(selectedUser.id);
        setUsers((prev) =>
          prev.map((user) => (user.id === updated.id ? updated : user))
        );
        toast.success("Usuario desactivado");
      }
      if (confirmMode === "activate") {
        const updated = await activateUser(selectedUser.id);
        setUsers((prev) =>
          prev.map((user) => (user.id === updated.id ? updated : user))
        );
        toast.success("Usuario activado");
      }
      if (confirmMode === "remove") {
        await removeUser(selectedUser.id);
        setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
        toast.success("Usuario removido");
      }
      setConfirmOpen(false);
    } catch {
      toast.error("No se pudo completar la accion");
    } finally {
      setSubmitting(false);
    }
  };

  if (forbidden) {
    return <NoPermission />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Administracion
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona accesos, roles y estados de los usuarios.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invitar usuario
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear usuario
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full max-w-sm items-center gap-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o email"
              />
            </div>
            <Button variant="ghost" onClick={loadData} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualizar
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={4}>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando usuarios...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/40">
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">
                          {user.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-foreground">
                          {user.rol_nombre ?? "Sin rol"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            user
                          )}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {statusLabel(user)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openChangeRole(user)}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Cambiar rol
                          </Button>
                          {user.estado === "inactivo" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openConfirm(user, "activate")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Activar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openConfirm(user, "deactivate")}
                            >
                              <UserX className="h-4 w-4" />
                              Desactivar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openConfirm(user, "remove")}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear usuario"
        description="Agrega un usuario nuevo a la empresa."
      >
        <form
          className="space-y-4"
          onSubmit={createForm.handleSubmit(handleCreate)}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input {...createForm.register("nombre")} />
            {createForm.formState.errors.nombre && (
              <p className="text-xs text-destructive">
                {createForm.formState.errors.nombre.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...createForm.register("email")} />
            {createForm.formState.errors.email && (
              <p className="text-xs text-destructive">
                {createForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...createForm.register("rolId")}
            >
              <option value="">Sin rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invitar usuario"
        description="Envia una invitacion por correo."
      >
        <form
          className="space-y-4"
          onSubmit={inviteForm.handleSubmit(handleInvite)}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...inviteForm.register("email")} />
            {inviteForm.formState.errors.email && (
              <p className="text-xs text-destructive">
                {inviteForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...inviteForm.register("rolId")}
            >
              <option value="">Sin rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Enviar invitacion
            </Button>
          </div>
        </form>
      </Modal>

      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar usuario"
        description="Actualiza datos basicos del usuario."
      >
        <form
          className="flex h-full flex-col justify-between gap-4"
          onSubmit={editForm.handleSubmit(handleEdit)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input {...editForm.register("nombre")} />
              {editForm.formState.errors.nombre && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.nombre.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" {...editForm.register("email")} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Guardar cambios
            </Button>
          </div>
        </form>
      </Drawer>

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Cambiar rol"
        description="Selecciona el rol para este usuario."
      >
        <form
          className="space-y-4"
          onSubmit={roleForm.handleSubmit(handleChangeRole)}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...roleForm.register("rolId")}
            >
              <option value="">Selecciona un rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
            {roleForm.formState.errors.rolId && (
              <p className="text-xs text-destructive">
                {roleForm.formState.errors.rolId.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRoleOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Actualizar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar accion"
        description="Esta accion actualizara el acceso del usuario."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {confirmMode === "remove"
              ? "Removera al usuario de la empresa."
              : confirmMode === "deactivate"
                ? "El usuario no podra ingresar hasta ser reactivado."
                : "El usuario podra acceder nuevamente."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
