import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ClipboardList, PlusCircle, Truck, UserRound, Boxes } from "lucide-react";

type Role = "Admin" | "Store User";
type BuyerStatus = "Active" | "Inactive";

type Buyer = {
  id: string;
  buyerName: string;
  merchandiserName: string;
  merchandiserPhone: string;
  gpqName: string;
  gpqPhone: string;
  status: BuyerStatus;
};

const STORAGE_KEY = "sticker-printer-management-v2";
const createId = () => Math.random().toString(36).slice(2, 10);

const initialBuyers: Buyer[] = [
  {
    id: "buyer-1",
    buyerName: "M&S Apparel",
    merchandiserName: "Rahim Uddin",
    merchandiserPhone: "01700000001",
    gpqName: "Nadia Akter",
    gpqPhone: "01700000002",
    status: "Active",
  },
];

const emptyBuyerForm = {
  buyerName: "",
  merchandiserName: "",
  merchandiserPhone: "",
  gpqName: "",
  gpqPhone: "",
  status: "Active" as BuyerStatus,
};

const StickerPrinter = () => {
  const { toast } = useToast();
  const [buyers, setBuyers] = useState<Buyer[]>(() => {
    if (typeof window === "undefined") return initialBuyers;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialBuyers;
    try {
      const parsed = JSON.parse(raw);
      return parsed.buyers?.length ? parsed.buyers : initialBuyers;
    } catch {
      return initialBuyers;
    }
  });
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(() => {
    if (typeof window === "undefined") return initialBuyers[0]?.id ?? "";
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialBuyers[0]?.id ?? "";
    try {
      const parsed = JSON.parse(raw);
      return parsed.selectedBuyerId || initialBuyers[0]?.id || "";
    } catch {
      return initialBuyers[0]?.id ?? "";
    }
  });
  const [buyerForm, setBuyerForm] = useState(emptyBuyerForm);
  const [role, setRole] = useState<Role>("Admin");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBuyerId, setEditingBuyerId] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedBuyer = buyers.find((buyer) => buyer.id === selectedBuyerId) ?? buyers[0];

  const buyerSummary = useMemo(() => {
    return buyers.map((buyer) => ({
      ...buyer,
      lowStock: false,
    }));
  }, [buyers]);

  const persistData = (nextBuyers: Buyer[], nextSelectedBuyerId: string = selectedBuyerId) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ buyers: nextBuyers, selectedBuyerId: nextSelectedBuyerId }));
  };

  const resetBuyerForm = () => {
    setShowAddForm(false);
    setEditingBuyerId(null);
    setBuyerForm(emptyBuyerForm);
  };

  const handleBuyerSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!buyerForm.buyerName.trim()) return;

    if (editingBuyerId) {
      const nextBuyers = buyers.map((buyer) =>
        buyer.id === editingBuyerId
          ? {
              ...buyer,
              buyerName: buyerForm.buyerName.trim(),
              merchandiserName: buyerForm.merchandiserName.trim(),
              merchandiserPhone: buyerForm.merchandiserPhone.trim(),
              gpqName: buyerForm.gpqName.trim(),
              gpqPhone: buyerForm.gpqPhone.trim(),
              status: buyerForm.status,
            }
          : buyer,
      );
      setBuyers(nextBuyers);
      persistData(nextBuyers, selectedBuyerId);
      toast({ title: "Buyer updated", description: `${buyerForm.buyerName.trim()} has been updated.` });
      resetBuyerForm();
      return;
    }

    const newBuyer: Buyer = {
      id: createId(),
      buyerName: buyerForm.buyerName.trim(),
      merchandiserName: buyerForm.merchandiserName.trim(),
      merchandiserPhone: buyerForm.merchandiserPhone.trim(),
      gpqName: buyerForm.gpqName.trim(),
      gpqPhone: buyerForm.gpqPhone.trim(),
      status: buyerForm.status,
    };

    const nextBuyers = [newBuyer, ...buyers];
    setBuyers(nextBuyers);
    setSelectedBuyerId(newBuyer.id);
    persistData(nextBuyers, newBuyer.id);
    toast({ title: "Buyer created", description: `${newBuyer.buyerName} is ready. Use the buyer card to open details.` });
    resetBuyerForm();
  };

  const handleDeleteBuyer = (buyerId: string) => {
    const confirmed = window.confirm("Delete this buyer? This will remove the buyer card from home.");
    if (!confirmed) return;

    const nextBuyers = buyers.filter((buyer) => buyer.id !== buyerId);
    const nextSelectedId = nextBuyers[0]?.id ?? "";
    setBuyers(nextBuyers);
    setSelectedBuyerId(nextSelectedId);
    persistData(nextBuyers, nextSelectedId);
    toast({ title: "Buyer deleted", description: "Buyer removed from sticker printer home." });
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditingBuyerId(buyer.id);
    setShowAddForm(true);
    setBuyerForm({
      buyerName: buyer.buyerName,
      merchandiserName: buyer.merchandiserName,
      merchandiserPhone: buyer.merchandiserPhone,
      gpqName: buyer.gpqName,
      gpqPhone: buyer.gpqPhone,
      status: buyer.status,
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-3 py-4 sm:px-4 md:px-6 md:py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Sticker Printer Home</p>
                <CardTitle className="text-2xl font-bold text-slate-900">Buyers & Cards</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-sky-200 bg-sky-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <ScanLine className="h-5 w-5 text-sky-600" /> Buyer Count
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Active Buyers</span><strong>{buyers.length}</strong></div>
                  <div className="flex justify-between"><span>Selected Buyer</span><strong>{selectedBuyer?.buyerName ?? "—"}</strong></div>
                </CardContent>
              </Card>
              <Card className="border-violet-200 bg-violet-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <ClipboardList className="h-5 w-5 text-violet-600" /> Buyer Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Active</span><strong>{buyers.filter((buyer) => buyer.status === "Active").length}</strong></div>
                  <div className="flex justify-between"><span>Inactive</span><strong>{buyers.filter((buyer) => buyer.status === "Inactive").length}</strong></div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Truck className="h-5 w-5 text-amber-600" /> Buyer Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-700">
                  {buyerSummary.map((buyer) => (
                    <div key={buyer.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white/70 px-3 py-2">
                      <div>
                        <p className="font-semibold text-slate-800">{buyer.buyerName}</p>
                        <p className="text-xs text-slate-500">{buyer.status}</p>
                      </div>
                      <Badge variant={buyer.status === "Active" ? "default" : "secondary"}>{buyer.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="w-full">
          <Card className="border-0 shadow-sm xl:sticky xl:top-4">
            <CardHeader className="px-4 pb-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Boxes className="h-5 w-5 text-slate-700" /> Buyer Cards
                </CardTitle>
                <Button type="button" variant="outline" onClick={() => (showAddForm || editingBuyerId ? resetBuyerForm() : setShowAddForm(true))}>
                  {showAddForm || editingBuyerId ? "Hide Form" : "Add New Buyer"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
              {showAddForm || editingBuyerId ? (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-6 sm:p-6 md:p-8">
                  <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{editingBuyerId ? "Edit Buyer" : "Add New Buyer"}</h3>
                        <p className="text-sm text-slate-500">{editingBuyerId ? "Update the buyer details below." : "Fill in the buyer details in a full-width popup window."}</p>
                      </div>
                      <Button type="button" variant="outline" onClick={resetBuyerForm}>
                        Close
                      </Button>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto p-5">
                      <form onSubmit={handleBuyerSubmit} className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label>Buyer Name</Label>
                          <Input
                            value={buyerForm.buyerName}
                            onChange={(event) => setBuyerForm({ ...buyerForm, buyerName: event.target.value })}
                            placeholder="Buyer Name"
                          />
                        </div>

                        <div>
                          <Label>Merchandiser Name</Label>
                          <Input
                            value={buyerForm.merchandiserName}
                            onChange={(event) => setBuyerForm({ ...buyerForm, merchandiserName: event.target.value })}
                            placeholder="Merchandiser Name"
                          />
                        </div>
                        <div>
                          <Label>Merchandiser Phone</Label>
                          <Input
                            value={buyerForm.merchandiserPhone}
                            onChange={(event) => setBuyerForm({ ...buyerForm, merchandiserPhone: event.target.value })}
                            placeholder="Phone"
                          />
                        </div>
                        <div>
                          <Label>GPQ Name</Label>
                          <Input
                            value={buyerForm.gpqName}
                            onChange={(event) => setBuyerForm({ ...buyerForm, gpqName: event.target.value })}
                            placeholder="GPQ Name"
                          />
                        </div>
                        <div>
                          <Label>GPQ Phone</Label>
                          <Input
                            value={buyerForm.gpqPhone}
                            onChange={(event) => setBuyerForm({ ...buyerForm, gpqPhone: event.target.value })}
                            placeholder="Phone"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Status</Label>
                          <Select value={buyerForm.status} onValueChange={(value) => setBuyerForm({ ...buyerForm, status: value as BuyerStatus })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                          <Button type="submit">
                            <PlusCircle className="mr-2 h-4 w-4" /> {editingBuyerId ? "Save Changes" : "Save Buyer"}
                          </Button>
                          <Button type="button" variant="outline" onClick={resetBuyerForm}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {buyers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  No buyers yet. Add a buyer to start managing cards.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {buyers.map((buyer) => (
                    <div
                      key={buyer.id}
                      role="button"
                      onClick={() => navigate(`/sticker-printer/${buyer.id}`)}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{buyer.buyerName}</p>
                          <p className="text-sm text-slate-500">Merchandiser: {buyer.merchandiserName}</p>
                          <p className="mt-2 text-sm text-slate-600">GPQ: {buyer.gpqName}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <Badge variant={buyer.status === "Active" ? "default" : "secondary"}>{buyer.status}</Badge>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/sticker-printer/${buyer.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              View Details
                            </Link>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditBuyer(buyer);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <Truck className="h-4 w-4" /> {buyer.gpqPhone}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteBuyer(buyer.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StickerPrinter;
