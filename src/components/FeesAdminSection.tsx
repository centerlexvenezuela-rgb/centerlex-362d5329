import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calculator, Plus, Trash2, Loader2, Save, Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface FeeCategory { id: string; name: string; display_order: number; }
interface FeeItem { id: string; category_id: string; name: string; amount_usd: number; notes: string | null; display_order: number; }
interface FeeTier { id: string; min_amount_usd: number; max_amount_usd: number | null; percentage: number; description: string | null; display_order: number; }

export const FeesAdminSection = () => {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [tiers, setTiers] = useState<FeeTier[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCatName, setNewCatName] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FeeItem | null>(null);
  const [newItem, setNewItem] = useState({ name: "", amount_usd: "", notes: "" });

  const [newTier, setNewTier] = useState({ min: "", max: "", percentage: "", description: "" });

  const load = async () => {
    setLoading(true);
    const [c, i, t] = await Promise.all([
      supabase.from("fee_categories").select("*").order("display_order"),
      supabase.from("fee_items").select("*").order("display_order"),
      supabase.from("fee_percentage_tiers").select("*").order("display_order"),
    ]);
    setCategories(c.data ?? []);
    setItems(i.data ?? []);
    setTiers(t.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Categorías
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from("fee_categories").insert({
      name: newCatName.trim(),
      display_order: categories.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Categoría creada");
    setNewCatName("");
    load();
  };
  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("fee_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoría eliminada");
    load();
  };

  // Items
  const addItem = async (categoryId: string) => {
    const amt = parseFloat(newItem.amount_usd.replace(",", "."));
    if (!newItem.name.trim() || isNaN(amt)) return toast.error("Nombre y monto requeridos");
    const catItems = items.filter((i) => i.category_id === categoryId);
    const { error } = await supabase.from("fee_items").insert({
      category_id: categoryId,
      name: newItem.name.trim(),
      amount_usd: amt,
      notes: newItem.notes.trim() || null,
      display_order: catItems.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Servicio agregado");
    setNewItem({ name: "", amount_usd: "", notes: "" });
    load();
  };
  const updateItem = async () => {
    if (!editingItem) return;
    const { error } = await supabase
      .from("fee_items")
      .update({
        name: editingItem.name,
        amount_usd: editingItem.amount_usd,
        notes: editingItem.notes,
      })
      .eq("id", editingItem.id);
    if (error) return toast.error(error.message);
    toast.success("Servicio actualizado");
    setEditingItem(null);
    load();
  };
  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("fee_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Servicio eliminado");
    load();
  };

  // Tiers
  const addTier = async () => {
    const min = parseFloat(newTier.min);
    const max = newTier.max.trim() ? parseFloat(newTier.max) : null;
    const pct = parseFloat(newTier.percentage);
    if (isNaN(min) || isNaN(pct)) return toast.error("Monto mínimo y porcentaje requeridos");
    const { error } = await supabase.from("fee_percentage_tiers").insert({
      min_amount_usd: min,
      max_amount_usd: max,
      percentage: pct,
      description: newTier.description.trim() || null,
      display_order: tiers.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Rango creado");
    setNewTier({ min: "", max: "", percentage: "", description: "" });
    load();
  };
  const deleteTier = async (id: string) => {
    const { error } = await supabase.from("fee_percentage_tiers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rango eliminado");
    load();
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Editor de Honorarios Mínimos</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tiers */}
          <section>
            <h3 className="font-serif text-lg mb-3">Rangos porcentuales (Art. 4)</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Desde (USD)</th>
                    <th className="py-2 pr-3">Hasta (USD)</th>
                    <th className="py-2 pr-3">%</th>
                    <th className="py-2 pr-3">Descripción</th>
                    <th className="py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tiers.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 pr-3">${Number(t.min_amount_usd).toLocaleString()}</td>
                      <td className="py-2 pr-3">{t.max_amount_usd ? `$${Number(t.max_amount_usd).toLocaleString()}` : "—"}</td>
                      <td className="py-2 pr-3">{t.percentage}%</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{t.description}</td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteTier(t.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-2 md:grid-cols-5 items-end p-3 rounded border bg-muted/30">
              <div>
                <Label className="text-xs">Desde</Label>
                <Input type="number" value={newTier.min} onChange={(e) => setNewTier({ ...newTier, min: e.target.value })} placeholder="1" />
              </div>
              <div>
                <Label className="text-xs">Hasta</Label>
                <Input type="number" value={newTier.max} onChange={(e) => setNewTier({ ...newTier, max: e.target.value })} placeholder="(vacío = sin tope)" />
              </div>
              <div>
                <Label className="text-xs">%</Label>
                <Input type="number" step="0.01" value={newTier.percentage} onChange={(e) => setNewTier({ ...newTier, percentage: e.target.value })} placeholder="10" />
              </div>
              <div>
                <Label className="text-xs">Descripción</Label>
                <Input value={newTier.description} onChange={(e) => setNewTier({ ...newTier, description: e.target.value })} placeholder="Opcional" />
              </div>
              <Button onClick={addTier} className="bg-primary hover:bg-primary-glow">
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="font-serif text-lg mb-3">Categorías y servicios</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nueva categoría (ej: Servicios Penales)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <Button onClick={addCategory} className="bg-primary hover:bg-primary-glow shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Categoría
              </Button>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => {
                const catItems = items.filter((i) => i.category_id === cat.id);
                const open = openCat === cat.id;
                return (
                  <div key={cat.id} className="border rounded-lg">
                    <div className="flex items-center justify-between p-3 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setOpenCat(open ? null : cat.id)}
                        className="text-left font-medium flex-1"
                      >
                        {cat.name}{" "}
                        <span className="text-xs text-muted-foreground">({catItems.length})</span>
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará "{cat.name}" y todos sus {catItems.length} servicios.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCategory(cat.id)} className="bg-destructive">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {open && (
                      <div className="p-3 space-y-3">
                        <ul className="divide-y">
                          {catItems.map((it) => (
                            <li key={it.id} className="py-2">
                              {editingItem?.id === it.id ? (
                                <div className="grid gap-2 md:grid-cols-[2fr_1fr_2fr_auto] items-end">
                                  <Input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} />
                                  <Input type="number" step="0.01" value={editingItem.amount_usd}
                                    onChange={(e) => setEditingItem({ ...editingItem, amount_usd: parseFloat(e.target.value) || 0 })} />
                                  <Textarea rows={1} value={editingItem.notes ?? ""} onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })} placeholder="Notas" />
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={updateItem}><Save className="h-3 w-3" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="h-3 w-3" /></Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{it.name}</p>
                                    {it.notes && <p className="text-xs text-muted-foreground">{it.notes}</p>}
                                  </div>
                                  <span className="text-sm font-semibold text-accent shrink-0">${Number(it.amount_usd).toLocaleString()}</span>
                                  <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingItem(it)}><Pencil className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteItem(it.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="grid gap-2 md:grid-cols-[2fr_1fr_2fr_auto] items-end p-3 rounded border bg-muted/20">
                          <div>
                            <Label className="text-xs">Nombre del servicio</Label>
                            <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                          </div>
                          <div>
                            <Label className="text-xs">Monto USD</Label>
                            <Input type="number" step="0.01" value={newItem.amount_usd} onChange={(e) => setNewItem({ ...newItem, amount_usd: e.target.value })} />
                          </div>
                          <div>
                            <Label className="text-xs">Notas (opcional)</Label>
                            <Input value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })} />
                          </div>
                          <Button onClick={() => addItem(cat.id)} className="bg-primary hover:bg-primary-glow">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </Card>
  );
};
