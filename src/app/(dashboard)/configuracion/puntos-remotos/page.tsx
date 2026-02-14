"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Power } from "lucide-react";

interface RemoteLocation {
  id: string;
  name: string;
  address: string;
  fudo_client_id: string;
  fudo_client_secret: string;
  is_active: boolean;
  delivery_fee: number;
  notes: string | null;
  created_at: string;
}

export default function PuntosRemotosPage() {
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState<RemoteLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    const { data, error } = await supabase
      .from("remote_pos_locations")
      .select("*")
      .order("created_at");

    if (!error) setLocations(data as RemoteLocation[]);
    setIsLoading(false);
  }

  function resetForm() {
    setName("");
    setAddress("");
    setClientId("");
    setClientSecret("");
    setDeliveryFee("");
    setNotes("");
    setEditingId(null);
  }

  function startEdit(loc: RemoteLocation) {
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setClientId(loc.fudo_client_id);
    setClientSecret(loc.fudo_client_secret);
    setDeliveryFee(String(loc.delivery_fee));
    setNotes(loc.notes || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);

    const record = {
      name: name.trim(),
      address: address.trim(),
      fudo_client_id: clientId.trim(),
      fudo_client_secret: clientSecret.trim(),
      delivery_fee: parseFloat(deliveryFee) || 0,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("remote_pos_locations")
          .update(record)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Punto actualizado");
      } else {
        const { error } = await supabase
          .from("remote_pos_locations")
          .insert(record);
        if (error) throw error;
        toast.success("Punto creado");
      }
      resetForm();
      loadLocations();
    } catch {
      toast.error("Error guardando punto");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(loc: RemoteLocation) {
    const { error } = await supabase
      .from("remote_pos_locations")
      .update({ is_active: !loc.is_active, updated_at: new Date().toISOString() })
      .eq("id", loc.id);

    if (error) {
      toast.error("Error actualizando estado");
      return;
    }
    toast.success(loc.is_active ? "Punto desactivado" : "Punto activado");
    loadLocations();
  }

  async function handleDelete(loc: RemoteLocation) {
    if (!confirm(`Eliminar "${loc.name}"? Esta accion no se puede deshacer.`)) return;

    const { error } = await supabase
      .from("remote_pos_locations")
      .delete()
      .eq("id", loc.id);

    if (error) {
      toast.error("Error eliminando punto");
      return;
    }
    toast.success("Punto eliminado");
    loadLocations();
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta pagina
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Puntos Remotos</h1>
      <p className="text-sm text-muted-foreground">
        Gestiona los puntos de venta externos (bares, aliados) que pueden enviar pedidos delivery a Fanzine.
      </p>

      {/* Create/Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Editar punto" : "Agregar punto"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: Bar La Terraza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Direccion *</Label>
                <Input
                  placeholder="Ej: Cra 7 #45-12, Chapinero"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fudo Client ID *</Label>
                <Input
                  placeholder="MDAwMDU6..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fudo Client Secret *</Label>
                <Input
                  type="password"
                  placeholder="XCeIOJ..."
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Fee</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input
                  placeholder="Notas internas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar punto"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Locations list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Puntos ({locations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded bg-muted" />
          ) : locations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay puntos remotos configurados
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Direccion</TableHead>
                    <TableHead className="text-right">Delivery Fee</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{loc.address}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${Number(loc.delivery_fee).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={loc.is_active ? "default" : "secondary"}>
                          {loc.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={loc.is_active ? "Desactivar" : "Activar"}
                            onClick={() => handleToggleActive(loc)}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => startEdit(loc)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Eliminar"
                            onClick={() => handleDelete(loc)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
