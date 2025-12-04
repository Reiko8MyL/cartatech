"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { AdminGuard } from "@/components/admin/admin-guard";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Save,
  AlertCircle,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toastSuccess, toastError } from "@/lib/toast";
import type { DeckFormat } from "@/lib/deck-builder/types";
import { getAllCards } from "@/lib/deck-builder/utils";
import type { Card as CardType } from "@/lib/deck-builder/types";

interface BanListCard {
  id: string;
  name: string;
  type: string;
  edition: string;
  image: string;
  banListRE: number;
  banListRL: number;
  banListLI: number;
  alternativeArtsCount: number;
}

const BAN_LIST_LABELS: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: "BAN", color: "text-red-600", bgColor: "bg-red-600/10 border-red-600/20" },
  1: { label: "Max 1", color: "text-orange-600", bgColor: "bg-orange-600/10 border-orange-600/20" },
  2: { label: "Max 2", color: "text-yellow-600", bgColor: "bg-yellow-600/10 border-yellow-600/20" },
  3: { label: "Libre", color: "text-green-600", bgColor: "bg-green-600/10 border-green-600/20" },
};

export default function AdminBanListPage() {
  const { user } = useAuth();
  const [format, setFormat] = useState<DeckFormat>("RE");
  const [cards, setCards] = useState<BanListCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<BanListCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");
  const [allCardsData, setAllCardsData] = useState<CardType[]>([]);

  // Cargar todas las cartas para el diálogo de agregar
  useEffect(() => {
    const cards = getAllCards();
    setAllCardsData(cards);
  }, []);

  async function loadBanList() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/ban-list?userId=${user.id}&format=${format}`);

      if (!response.ok) {
        throw new Error("Error al cargar ban list");
      }

      const data = await response.json();
      const allCards = data.cards || [];
      
      // Filtrar cartas libres (banList = 3)
      const restrictedCards = allCards.filter((card: BanListCard) => {
        const value = getBanListValue(card);
        return value !== 3;
      });

      // En formato RE, filtrar edición Drácula
      const filtered = format === "RE"
        ? restrictedCards.filter((card: BanListCard) => card.edition !== "Drácula")
        : restrictedCards;

      setCards(filtered);
    } catch (error) {
      console.error("Error al cargar ban list:", error);
      toastError("Error al cargar ban list");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBanList();
    setPendingChanges(new Map());
  }, [user, format]);

  // Filtrar cartas por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = cards.filter(
      (card) =>
        card.id.toLowerCase().includes(term) ||
        card.name.toLowerCase().includes(term) ||
        card.type.toLowerCase().includes(term) ||
        card.edition.toLowerCase().includes(term)
    );
    setFilteredCards(filtered);
  }, [searchTerm, cards]);

  function getBanListValue(card: BanListCard): number {
    return format === "RE"
      ? card.banListRE
      : format === "RL"
      ? card.banListRL
      : card.banListLI;
  }

  function getBanListLabel(value: number) {
    return BAN_LIST_LABELS[value] || BAN_LIST_LABELS[3];
  }

  function handleChangeValue(cardId: string, newValue: number) {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(cardId, newValue);
      return next;
    });

    // Actualizar estado local inmediatamente para preview
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          return {
            ...card,
            [`banList${format}`]: newValue,
          } as BanListCard;
        }
        return card;
      })
    );
  }

  async function handleSaveAll() {
    if (!user?.id || pendingChanges.size === 0) {
      toastError("No hay cambios para guardar");
      return;
    }

    setIsSaving(true);

    try {
      const updates = Array.from(pendingChanges.entries());
      
      // Guardar todos los cambios
      for (const [cardId, value] of updates) {
        const response = await fetch(`/api/admin/ban-list`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            cardId,
            format,
            value,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Error al actualizar ${cardId}`);
        }
      }

      toastSuccess(`${updates.length} carta(s) actualizada(s) exitosamente`);
      setPendingChanges(new Map());
      // Recargar la lista (las que se marcaron como 3 ya no aparecerán)
      await loadBanList();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toastError(
        error instanceof Error
          ? error.message
          : "Error al guardar cambios"
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddCard(card: CardType) {
    const baseId = card.id.split("-").slice(0, 2).join("-");
    
    // Verificar si la carta ya está en la lista
    if (cards.some((c) => c.id === baseId)) {
      toastError("Esta carta ya está en la lista");
      return;
    }

    // Agregar la carta con valor 0 (BAN) por defecto
    const newCard: BanListCard = {
      id: baseId,
      name: card.name,
      type: card.type,
      edition: card.edition,
      image: card.image,
      banListRE: format === "RE" ? 0 : card.banListRE || 3,
      banListRL: format === "RL" ? 0 : card.banListRL || 3,
      banListLI: format === "LI" ? 0 : card.banListLI || 3,
      alternativeArtsCount: 0,
    };

    setCards((prev) => [...prev, newCard]);
    handleChangeValue(baseId, 0);
    setShowAddDialog(false);
    setAddSearchTerm("");
    toastSuccess(`Carta ${card.name} agregada a la lista`);
  }

  // Filtrar cartas para el diálogo de agregar
  const availableCardsToAdd = useMemo(() => {
    const currentCardIds = new Set(cards.map((c) => c.id));
    const term = addSearchTerm.toLowerCase();

    return allCardsData.filter((card) => {
      const baseId = card.id.split("-").slice(0, 2).join("-");
      
      // No mostrar si ya está en la lista
      if (currentCardIds.has(baseId)) return false;
      
      // En formato RE, no mostrar Drácula
      if (format === "RE" && card.edition === "Drácula") return false;

      // Filtrar por búsqueda
      if (term) {
        return (
          card.id.toLowerCase().includes(term) ||
          card.name.toLowerCase().includes(term) ||
          card.type.toLowerCase().includes(term) ||
          card.edition.toLowerCase().includes(term)
        );
      }

      return true;
    }).slice(0, 50); // Limitar a 50 resultados
  }, [allCardsData, cards, addSearchTerm, format]);

  // Agrupar cartas por estado de ban list
  const groupedCards = useMemo(() => {
    const groups: Record<number, BanListCard[]> = {
      0: [],
      1: [],
      2: [],
    };

    filteredCards.forEach((card) => {
      const value = pendingChanges.get(card.id) ?? getBanListValue(card);
      if (value !== 3) {
        groups[value].push(card);
      }
    });

    return groups;
  }, [filteredCards, format, pendingChanges]);

  return (
    <AdminGuard requiredRole="ADMIN">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Ban List</h1>
            <p className="text-muted-foreground">
              Actualiza la lista de cartas prohibidas y restringidas para cada formato
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="size-4 mr-2" />
              Agregar Carta
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || pendingChanges.size === 0}
            >
              {isSaving ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Guardar {pendingChanges.size > 0 && `(${pendingChanges.size})`}
            </Button>
          </div>
        </div>

        {/* Selector de formato */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Formato</CardTitle>
            <CardDescription>
              Selecciona el formato para gestionar su ban list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(value) => {
                if (value) setFormat(value as DeckFormat);
              }}
              className="w-full max-w-md"
            >
              <ToggleGroupItem value="RE" className="flex-1">
                Racial Edición
              </ToggleGroupItem>
              <ToggleGroupItem value="RL" className="flex-1">
                Racial Libre
              </ToggleGroupItem>
              <ToggleGroupItem value="LI" className="flex-1">
                Formato Libre
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Buscar por ID, nombre, tipo o edición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cartas agrupadas por estado */}
            {[0, 1, 2].map((banValue) => {
              const groupCards = groupedCards[banValue];
              if (groupCards.length === 0) return null;

              const label = getBanListLabel(banValue);

              return (
                <Card key={banValue}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle>{label.label}</CardTitle>
                        <Badge variant="outline" className={label.bgColor}>
                          {groupCards.length} carta{groupCards.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {banValue === 0
                        ? "Cartas completamente prohibidas (0 copias permitidas)"
                        : banValue === 1
                        ? "Cartas restringidas a máximo 1 copia por mazo"
                        : "Cartas restringidas a máximo 2 copias por mazo"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {groupCards.map((card) => {
                        const currentValue = pendingChanges.get(card.id) ?? getBanListValue(card);
                        const hasPendingChange = pendingChanges.has(card.id);

                        return (
                          <Card
                            key={card.id}
                            className={`relative overflow-hidden border-2 ${
                              hasPendingChange ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                            style={{
                              borderColor:
                                currentValue === 0
                                  ? "#dc2626"
                                  : currentValue === 1
                                  ? "#ea580c"
                                  : "#ca8a04",
                            }}
                          >
                            {/* Imagen de la carta */}
                            <div className="relative aspect-[63/88] w-full">
                              <Image
                                src={card.image}
                                alt={card.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 33vw, 20vw"
                              />
                              {/* Overlay con información */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-2">
                                <div className="text-white">
                                  <div className="font-semibold text-sm mb-1 truncate">
                                    {card.name}
                                  </div>
                                  <div className="text-xs opacity-80 mb-2">
                                    {card.id} • {card.type}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`${getBanListLabel(currentValue).bgColor} text-white border-white/30`}
                                    >
                                      {getBanListLabel(currentValue).label}
                                    </Badge>
                                    {hasPendingChange && (
                                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                        Pendiente
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Controles */}
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (currentValue > 0) {
                                      handleChangeValue(card.id, currentValue - 1);
                                    }
                                  }}
                                  disabled={currentValue === 0}
                                  className="flex-1"
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <div className="flex-1 text-center">
                                  <Badge
                                    variant="outline"
                                    className={getBanListLabel(currentValue).bgColor}
                                  >
                                    {getBanListLabel(currentValue).label}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (currentValue < 2) {
                                      handleChangeValue(card.id, currentValue + 1);
                                    }
                                  }}
                                  disabled={currentValue === 2}
                                  className="flex-1"
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full mt-2"
                                onClick={() => {
                                  // Marcar como libre (3) para que se quite de la lista al guardar
                                  handleChangeValue(card.id, 3);
                                }}
                              >
                                <X className="size-3 mr-1" />
                                Marcar como Libre
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredCards.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="size-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No hay cartas en la ban list para este formato
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="size-4 mr-2" />
                    Agregar Carta
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Dialog para agregar cartas */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Carta a la Ban List</DialogTitle>
              <DialogDescription>
                Busca y selecciona una carta para agregarla a la ban list del formato {format}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Buscar por ID, nombre, tipo o edición..."
                  value={addSearchTerm}
                  onChange={(e) => setAddSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                {availableCardsToAdd.map((card) => {
                  const baseId = card.id.split("-").slice(0, 2).join("-");
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleAddCard(card)}
                      className="relative aspect-[63/88] rounded-lg overflow-hidden border-2 border-border hover:border-primary hover:scale-105 transition-all"
                    >
                      <Image
                        src={card.image}
                        alt={card.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 truncate">
                        {card.name}
                      </div>
                    </button>
                  );
                })}
              </div>
              {availableCardsToAdd.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron cartas disponibles
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
