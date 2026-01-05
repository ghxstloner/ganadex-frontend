"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import NoPermission from "@/components/no-permission";
import {
  createRole,
  fetchRolePermissions,
  fetchRoles,
  updateRole,
  updateRolePermissions,
} from "@/lib/api/admin.service";
import type { RoleDTO } from "@/lib/types/admin";
import { permissionDefinitions, permissionModules } from "@/lib/permissions";

const roleSchema = z.object({
  nombre: z.string().min(2, "Ingresa el nombre"),
  descripcion: z.string().optional(),
});

type RoleForm = z.infer<typeof roleSchema>;

type PermissionState = {
  selected: string[];
  loading: boolean;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    selected: [],
    loading: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const createForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { nombre: "", descripcion: "" },
  });

  const editForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { nombre: "", descripcion: "" },
  });

  const permissionsByModule = useMemo(() => {
    return permissionModules.map((module) => ({
      module,
      permissions: permissionDefinitions.filter(
        (permission) => permission.module === module
      ),
    }));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const rolesResponse = await fetchRoles({ toastOnError: false });
      setRoles(rolesResponse);
      setForbidden(false);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 403) {
        setForbidden(true);
      } else {
        toast.error("No se pudieron cargar los roles");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (role: RoleDTO) => {
    setSelectedRole(role);
    editForm.reset({ nombre: role.nombre, descripcion: role.descripcion ?? "" });
    setEditOpen(true);
  };

  const openPermissions = async (role: RoleDTO) => {
    setSelectedRole(role);
    setPermissionsOpen(true);
    setPermissionState({ selected: [], loading: true });
    try {
      const response = await fetchRolePermissions(role.id);
      setPermissionState({ selected: response.permisos ?? [], loading: false });
    } catch {
      toast.error("No se pudieron cargar los permisos");
      setPermissionState({ selected: [], loading: false });
    }
  };

  const handleCreate = async (values: RoleForm) => {
    setSubmitting(true);
    try {
      const created = await createRole({
        nombre: values.nombre,
        descripcion: values.descripcion || null,
      });
      setRoles((prev) => [created, ...prev]);
      toast.success("Rol creado");
      setCreateOpen(false);
      createForm.reset();
    } catch {
      toast.error("No se pudo crear el rol");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: RoleForm) => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const updated = await updateRole(selectedRole.id, {
        nombre: values.nombre,
        descripcion: values.descripcion || null,
      });
      setRoles((prev) =>
        prev.map((role) => (role.id === updated.id ? updated : role))
      );
      toast.success("Rol actualizado");
      setEditOpen(false);
    } catch {
      toast.error("No se pudo actualizar el rol");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setPermissionState((prev) => {
      const exists = prev.selected.includes(permissionId);
      return {
        ...prev,
        selected: exists
          ? prev.selected.filter((id) => id !== permissionId)
          : [...prev.selected, permissionId],
      };
    });
  };

  const confirmPermissionSave = () => {
    setConfirmOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const updated = await updateRolePermissions(
        selectedRole.id,
        permissionState.selected
      );
      setRoles((prev) =>
        prev.map((role) => (role.id === updated.id ? updated : role))
      );
      toast.success("Permisos actualizados");
      setConfirmOpen(false);
      setPermissionsOpen(false);
    } catch {
      toast.error("No se pudieron guardar los permisos");
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
          <h1 className="text-2xl font-semibold text-foreground">
            Roles y permisos
          </h1>
          <p className="text-sm text-muted-foreground">
            Define perfiles y controla los accesos por modulo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear rol
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando roles...
            </CardContent>
          </Card>
        ) : roles.length ? (
          roles.map((role) => (
            <Card key={role.id} className="border-border bg-card">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-card-foreground">
                      {role.nombre}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {role.descripcion || "Sin descripcion"}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1">
                    <ClipboardList className="h-3 w-3" />
                    {role.permisos?.length ?? 0} permisos
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPermissions(role)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Asignar permisos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay roles creados.
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear rol"
        description="Define el nombre y descripcion del rol."
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
            <label className="text-sm font-medium">Descripcion</label>
            <Input {...createForm.register("descripcion")} />
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

      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar rol"
        description="Actualiza la informacion del rol."
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
              <label className="text-sm font-medium">Descripcion</label>
              <Input {...editForm.register("descripcion")} />
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
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        title="Asignar permisos"
        description="Selecciona los permisos habilitados para este rol."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Permisos seleccionados</span>
            <span className="font-semibold text-foreground">
              {permissionState.selected.length}
            </span>
          </div>
          {permissionState.loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando permisos...
            </div>
          ) : (
            <div className="space-y-4">
              {permissionsByModule.map((group) => (
                <div key={group.module} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    {group.module}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const checked = permissionState.selected.includes(
                        permission.id
                      );
                      return (
                        <label
                          key={permission.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <span>{permission.label}</span>
                          <button
                            type="button"
                            onClick={() => togglePermission(permission.id)}
                            className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </button>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPermissionsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmPermissionSave}
              disabled={permissionState.loading}
            >
              Guardar permisos
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar cambios"
        description="Confirma la actualizacion de permisos."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se aplicaran {permissionState.selected.length} permisos al rol.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={submitting}>
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
