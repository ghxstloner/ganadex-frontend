"use client";

import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type NoPermissionProps = {
  title?: string;
  description?: string;
};

export default function NoPermission({
  title = "Sin permisos",
  description = "No tienes acceso a este modulo. Contacta al administrador.",
}: NoPermissionProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-border bg-card text-center">
        <CardContent className="space-y-3 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
