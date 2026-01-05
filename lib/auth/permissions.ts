import type { GanadexSession } from "@/lib/types/auth";

export function getSessionPermissions(session: GanadexSession | null) {
  return session?.permisos ?? [];
}

export function hasPermission(
  session: GanadexSession | null,
  required: string | string[]
) {
  if (!required) return true;
  const permissions = getSessionPermissions(session);
  if (!permissions.length) return true;
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((permission) => permissions.includes(permission));
}
