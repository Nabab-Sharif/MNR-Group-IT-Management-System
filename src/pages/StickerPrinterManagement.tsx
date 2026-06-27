import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Boxes,
  Clock,
  ClipboardList,
  MoreVertical,
  Pencil,
  PlusCircle,
  ScanLine,
  Trash2,
  UserRound,
  ArrowLeft,
} from "lucide-react";

type RollType = "sticker" | "ribbon";
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

type Roll = {
  id: string;
  buyerId: string;
  type: RollType;
  rollNo: string;
  size: string;
  receiveDate: string;
  originalPcs: number;
  usedPcs: number;
  damagePcs: number;
  availablePcs: number;
  status: string;
  remarks: string;
  poNumber: string;
  styleNumber: string;
  receiveBy: string;
  designation: string;
  phoneNumber: string;
  pcsPerRoll: number;
  receiveRollQty: number;
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

const initialRolls: Roll[] = [
  {
    id: "roll-1",
    buyerId: "buyer-1",
    type: "sticker",
    rollNo: "ST-001",
    size: "4x4",
    receiveDate: "2026-06-20",
    originalPcs: 25000,
    usedPcs: 6000,
    damagePcs: 200,
    availablePcs: 18800,
    status: "In Use",
    remarks: "Fresh received",
    poNumber: "PO-1001",
    styleNumber: "STY-2001",
    receiveBy: "Store Team",
    designation: "Store Keeper",
    phoneNumber: "01700000010",
    pcsPerRoll: 5000,
    receiveRollQty: 5,
  },
  {
    id: "roll-2",
    buyerId: "buyer-1",
    type: "ribbon",
    rollNo: "RB-001",
    size: "300m",
    receiveDate: "2026-06-21",
    originalPcs: 300,
    usedPcs: 50,
    damagePcs: 5,
    availablePcs: 245,
    status: "Available",
    remarks: "Ribbon stock",
    poNumber: "PO-1002",
    styleNumber: "STY-2002",
    receiveBy: "Store Team",
    designation: "Store Keeper",
    phoneNumber: "01700000010",
    pcsPerRoll: 300,
    receiveRollQty: 1,
  },
];

const emptyReceiveForm = {
  receiveDate: new Date().toISOString().slice(0, 10),
  receiveBy: "",
  designation: "",
  phoneNumber: "",
  size: "",
  receiveRollQty: 1,
  pcsPerRoll: 5000,
  remarks: "",
  poNumber: "",
  styleNumber: "",
};

const emptyIssueForm = {
  issueDate: new Date().toISOString().slice(0, 10),
  poNumber: "",
  styleNumber: "",
  issuePcs: 0,
  remarks: "",
};

const emptyDamageForm = {
  damageDate: new Date().toISOString().slice(0, 10),
  damagePcs: 0,
  damageReason: "",
  remarks: "",
};

const StickerPrinterManagement = () => {
  const { buyerId } = useParams<{ buyerId: string }>();
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
  const [rolls, setRolls] = useState<Roll[]>(() => {
    if (typeof window === "undefined") return initialRolls;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialRolls;
    try {
      const parsed = JSON.parse(raw);
      return parsed.rolls?.length ? parsed.rolls : initialRolls;
    } catch {
      return initialRolls;
    }
  });
  const [role, setRole] = useState<Role>("Admin");
  const [receiveType, setReceiveType] = useState<RollType>("sticker");
  const [receiveForm, setReceiveForm] = useState(emptyReceiveForm);
  const [editingRollId, setEditingRollId] = useState<string | null>(null);
  const [editReceiveForm, setEditReceiveForm] = useState({
    size: "",
    receiveDate: "",
    remarks: "",
    poNumber: "",
    styleNumber: "",
    pcsPerRoll: 0,
  });
  const [activeRollId, setActiveRollId] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [damageForm, setDamageForm] = useState(emptyDamageForm);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showDamageDialog, setShowDamageDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const selectedBuyer = buyers.find((buyer) => buyer.id === buyerId);
  const currentBuyerRolls = useMemo(() => {
    if (!selectedBuyer) return [];
    return rolls.filter((roll) => roll.buyerId === selectedBuyer.id);
  }, [selectedBuyer, rolls]);
  const selectedRoll = currentBuyerRolls.find((roll) => roll.id === activeRollId) ?? null;
  const editingRoll = currentBuyerRolls.find((roll) => roll.id === editingRollId) ?? null;

  const persistData = (nextBuyers: Buyer[], nextRolls: Roll[]) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ buyers: nextBuyers, rolls: nextRolls }));
  };

  const handleReceiveSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBuyer) return;

    const totalPcs = Number(receiveForm.pcsPerRoll) * Number(receiveForm.receiveRollQty);
    const newRoll: Roll = {
      id: createId(),
      buyerId: selectedBuyer.id,
      type: receiveType,
      rollNo: `${receiveType === "sticker" ? "ST" : "RB"}-${String(
        rolls.filter((roll) => roll.type === receiveType && roll.buyerId === selectedBuyer.id).length + 1
      ).padStart(3, "0")}`,
      size: receiveForm.size.trim(),
      receiveDate: receiveForm.receiveDate,
      originalPcs: totalPcs,
      usedPcs: 0,
      damagePcs: 0,
      availablePcs: totalPcs,
      status: "Available",
      remarks: receiveForm.remarks.trim(),
      poNumber: receiveForm.poNumber.trim(),
      styleNumber: receiveForm.styleNumber.trim(),
      receiveBy: receiveForm.receiveBy.trim(),
      designation: receiveForm.designation.trim(),
      phoneNumber: receiveForm.phoneNumber.trim(),
      pcsPerRoll: Number(receiveForm.pcsPerRoll),
      receiveRollQty: Number(receiveForm.receiveRollQty),
    };

    const nextRolls = [newRoll, ...rolls];
    setRolls(nextRolls);
    persistData(buyers, nextRolls);
    setReceiveForm(emptyReceiveForm);
    setShowReceiveDialog(false);
    setActiveRollId(newRoll.id);
    toast({ title: `${receiveType === "sticker" ? "Sticker" : "Ribbon"} received`, description: `New receive entry created for ${selectedBuyer.buyerName}.` });
  };

  const startEditRoll = (roll: Roll) => {
    setEditingRollId(roll.id);
    setActiveRollId(roll.id);
    setEditReceiveForm({
      size: roll.size,
      receiveDate: roll.receiveDate,
      remarks: roll.remarks,
      poNumber: roll.poNumber,
      styleNumber: roll.styleNumber,
      pcsPerRoll: roll.pcsPerRoll,
    });
  };

  const handleEditRollSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRollId) return;

    const nextRolls = rolls.map((roll) => {
      if (roll.id !== editingRollId) return roll;
      return {
        ...roll,
        size: editReceiveForm.size.trim() || roll.size,
        receiveDate: editReceiveForm.receiveDate || roll.receiveDate,
        remarks: editReceiveForm.remarks.trim() || roll.remarks,
        poNumber: editReceiveForm.poNumber.trim() || roll.poNumber,
        styleNumber: editReceiveForm.styleNumber.trim() || roll.styleNumber,
        pcsPerRoll: Number(editReceiveForm.pcsPerRoll) || roll.pcsPerRoll,
      };
    });

    setRolls(nextRolls);
    persistData(buyers, nextRolls);
    setEditingRollId(null);
    setShowEditDialog(false);
    toast({ title: "Receive updated", description: "The selected receive row was updated." });
  };

  const handleDeleteRoll = (rollId: string) => {
    if (role === "Store User") {
      toast({ title: "Delete blocked", description: "Only Admin can remove receive entries." });
      return;
    }

    const confirmed = window.confirm("Delete this receive roll?");
    if (!confirmed) return;

    const nextRolls = rolls.filter((roll) => roll.id !== rollId);
    setRolls(nextRolls);
    persistData(buyers, nextRolls);
    toast({ title: "Receive deleted", description: "The selected roll was removed from the ledger." });
  };

  const handleIssueSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRoll) return;

    const issuePcs = Number(issueForm.issuePcs);
    if (issuePcs <= 0 || issuePcs > selectedRoll.availablePcs) {
      toast({ title: "Invalid issue", description: "Issue quantity must be positive and within available balance." });
      return;
    }

    const nextRolls = rolls.map((roll) => {
      if (roll.id !== selectedRoll.id) return roll;
      const nextAvailable = roll.availablePcs - issuePcs;
      return {
        ...roll,
        usedPcs: roll.usedPcs + issuePcs,
        availablePcs: nextAvailable,
        status: nextAvailable <= 0 ? "Fully Used" : "Partially Used",
        poNumber: issueForm.poNumber.trim() || roll.poNumber,
        styleNumber: issueForm.styleNumber.trim() || roll.styleNumber,
        remarks: issueForm.remarks.trim() || roll.remarks,
      };
    });

    setRolls(nextRolls);
    persistData(buyers, nextRolls);
    setIssueForm(emptyIssueForm);
    setShowIssueDialog(false);
    toast({ title: "Issue recorded", description: `${issuePcs} PCS issued from ${selectedRoll.rollNo}.` });
  };

  const handleDamageSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRoll) return;

    const damagePcs = Number(damageForm.damagePcs);
    if (damagePcs <= 0 || damagePcs > selectedRoll.availablePcs) {
      toast({ title: "Invalid damage", description: "Damage quantity must be positive and within available balance." });
      return;
    }

    const nextRolls = rolls.map((roll) => {
      if (roll.id !== selectedRoll.id) return roll;
      const nextAvailable = roll.availablePcs - damagePcs;
      return {
        ...roll,
        damagePcs: roll.damagePcs + damagePcs,
        availablePcs: nextAvailable,
        status: nextAvailable <= 0 ? "Damaged" : "Partial Damage",
        remarks: damageForm.remarks.trim() || roll.remarks,
      };
    });

    setRolls(nextRolls);
    persistData(buyers, nextRolls);
    setDamageForm(emptyDamageForm);
    setShowDamageDialog(false);
    toast({ title: "Damage recorded", description: `${damagePcs} PCS marked damaged for ${selectedRoll.rollNo}.` });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-3 py-4 sm:px-4 md:px-6 md:py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Sticker Printer Buyer Card</p>
                <CardTitle className="text-2xl font-bold text-slate-900">Buyer Details</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/sticker-printer"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedBuyer ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                Buyer not found. Return to home and select a valid buyer card.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6">
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <UserRound className="h-5 w-5 text-slate-700" /> {selectedBuyer.buyerName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{selectedBuyer.buyerName}</p>
                            <p className="text-sm text-slate-600">Merchandiser: {selectedBuyer.merchandiserName} • GPQ: {selectedBuyer.gpqName}</p>
                          </div>
                          <Badge variant="outline" className="px-3 py-1 text-sm">{selectedBuyer.status}</Badge>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          <div className="rounded-xl border border-sky-300/70 bg-sky-50/80 p-4 shadow-sm shadow-sky-100">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-950">Sticker Summary</p>
                              <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold capitalize tracking-[0.16em] text-slate-950">
                                <ScanLine className="mr-2 h-4 w-4 text-slate-900" /> Active
                              </div>
                            </div>
                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs capitalize tracking-[0.24em] text-slate-400">Receive</p>
                                <div className="mt-4 space-y-3">
                                  <div className="rounded-2xl bg-slate-50 p-3">
                                    <p className="text-[11px] capitalize tracking-[0.2em] text-slate-400">Rolls</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{currentBuyerRolls.filter((roll) => roll.type === "sticker").length}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 p-3">
                                    <p className="text-[11px] capitalize tracking-[0.2em] text-slate-400">Pcs</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{currentBuyerRolls.filter((roll) => roll.type === "sticker").reduce((sum, roll) => sum + roll.originalPcs, 0).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs capitalize tracking-[0.24em] text-slate-400">Stock</p>
                                <div className="mt-4 space-y-3">
                                  <div className="rounded-2xl bg-slate-50 p-3">
                                    <p className="text-[11px] capitalize tracking-[0.2em] text-slate-400">Rolls</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{currentBuyerRolls.filter((roll) => roll.type === "sticker" && roll.availablePcs > 0).length}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 p-3">
                                    <p className="text-[11px] capitalize tracking-[0.2em] text-slate-400">Pcs</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{currentBuyerRolls.filter((roll) => roll.type === "sticker").reduce((sum, roll) => sum + roll.availablePcs, 0).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-violet-300/75 bg-violet-50/90 p-4 shadow-sm shadow-violet-100">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-950">Ribbon Summary</p>
                              <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold capitalize tracking-[0.16em] text-slate-950">
                                <Boxes className="mr-2 h-4 w-4 text-slate-900" /> Active
                              </div>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs capitalize tracking-[0.24em] text-slate-400">Receive rolls</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900">{currentBuyerRolls.filter((roll) => roll.type === "ribbon").length}</p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs capitalize tracking-[0.24em] text-slate-400">Stock rolls</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900">{currentBuyerRolls.filter((roll) => roll.type === "ribbon" && roll.availablePcs > 0).length}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {showReceiveDialog ? (
                        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-6 sm:p-6 md:p-8">
                          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">{receiveType === "sticker" ? "Sticker Receive" : "Ribbon Receive"}</h3>
                                <p className="text-sm text-slate-500">Add a new receive entry in a popup window.</p>
                              </div>
                              <Button type="button" variant="outline" onClick={() => setShowReceiveDialog(false)}>
                                Close
                              </Button>
                            </div>

                            <div className="max-h-[80vh] overflow-y-auto p-5">
                              <form onSubmit={handleReceiveSubmit} className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label>Receive Date</Label>
                                  <Input type="date" value={receiveForm.receiveDate} onChange={(event) => setReceiveForm({ ...receiveForm, receiveDate: event.target.value })} />
                                </div>
                                <div>
                                  <Label>Received By</Label>
                                  <Input value={receiveForm.receiveBy} onChange={(event) => setReceiveForm({ ...receiveForm, receiveBy: event.target.value })} placeholder="Name" />
                                </div>
                                <div>
                                  <Label>Designation</Label>
                                  <Input value={receiveForm.designation} onChange={(event) => setReceiveForm({ ...receiveForm, designation: event.target.value })} placeholder="Designation" />
                                </div>
                                <div>
                                  <Label>Phone Number</Label>
                                  <Input value={receiveForm.phoneNumber} onChange={(event) => setReceiveForm({ ...receiveForm, phoneNumber: event.target.value })} placeholder="Phone" />
                                </div>
                                <div>
                                  <Label>Size</Label>
                                  <Input value={receiveForm.size} onChange={(event) => setReceiveForm({ ...receiveForm, size: event.target.value })} placeholder={receiveType === "sticker" ? "Sticker Size" : "Ribbon Size"} />
                                </div>
                                <div>
                                  <Label>Receive Roll Qty</Label>
                                  <Input type="number" min="1" value={receiveForm.receiveRollQty} onChange={(event) => setReceiveForm({ ...receiveForm, receiveRollQty: Number(event.target.value) })} />
                                </div>
                                {receiveType === "sticker" ? (
                                  <div>
                                    <Label>PCS Per Roll</Label>
                                    <Input type="number" min="1" value={receiveForm.pcsPerRoll} onChange={(event) => setReceiveForm({ ...receiveForm, pcsPerRoll: Number(event.target.value) })} />
                                  </div>
                                ) : null}
                                <div className="md:col-span-2">
                                  <Label>Remarks</Label>
                                  <Textarea value={receiveForm.remarks} onChange={(event) => setReceiveForm({ ...receiveForm, remarks: event.target.value })} placeholder="Remarks" />
                                </div>
                                <div className="md:col-span-2 flex gap-2">
                                  <Button type="submit">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add {receiveType === "sticker" ? "Sticker" : "Ribbon"} Receive
                                  </Button>
                                  <Button type="button" variant="outline" onClick={() => setShowReceiveDialog(false)}>
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 bg-white shadow-sm w-full">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <ClipboardList className="h-5 w-5 text-slate-700" /> Buyer Ledger
                      </CardTitle>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant={receiveType === "sticker" ? "default" : "outline"}
                          onClick={() => {
                            setReceiveType("sticker");
                            setShowReceiveDialog(false);
                          }}
                        >
                          Sticker Receive
                        </Button>
                        <Button
                          variant={receiveType === "ribbon" ? "default" : "outline"}
                          onClick={() => {
                            setReceiveType("ribbon");
                            setShowReceiveDialog(false);
                          }}
                        >
                          Ribbon Receive
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 w-full">
                      <div className="flex justify-end p-0">
                        <Button type="button" onClick={() => { setShowReceiveDialog(true); }}>
                          Add {receiveType === "sticker" ? "Sticker" : "Ribbon"} Receive
                        </Button>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white w-full">
                        <table className="min-w-full w-full table-fixed border-collapse text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Roll</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Size</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Original</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Used</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Damage</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Available</th>
                              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentBuyerRolls.filter((roll) => roll.type === receiveType).map((roll) => (
                              <tr key={roll.id} className={`cursor-pointer hover:bg-slate-50 ${activeRollId === roll.id ? "bg-sky-50" : ""}`} onClick={() => setActiveRollId(roll.id)}>
                                <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{roll.rollNo}</td>
                                <td className="border border-slate-300 px-4 py-3 text-slate-600">{roll.receiveDate}</td>
                                <td className="border border-slate-300 px-4 py-3 text-slate-600">{roll.size}</td>
                                <td className="border border-slate-300 px-4 py-3 text-slate-600">{roll.originalPcs.toLocaleString()}</td>
                                <td className="border border-slate-300 px-4 py-3 text-slate-600">{roll.usedPcs.toLocaleString()}</td>
                                <td className="border border-slate-300 px-4 py-3 text-slate-600">
                                  <button
                                    type="button"
                                    className="w-full text-left text-slate-600 hover:text-slate-900"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setActiveRollId(roll.id);
                                      setDamageForm({ ...emptyDamageForm, damageDate: new Date().toISOString().slice(0, 10) });
                                      setShowDamageDialog(true);
                                    }}
                                  >
                                    {roll.damagePcs.toLocaleString()}
                                  </button>
                                </td>
                                <td className="border border-slate-300 px-4 py-3 text-slate-600">
                                  <button
                                    type="button"
                                    className="w-full text-left text-slate-600 hover:text-slate-900"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (roll.availablePcs <= 0) {
                                        toast({ title: "No available stock", description: "Issue cannot be created because there are no available PCS." });
                                        return;
                                      }
                                      setActiveRollId(roll.id);
                                      setIssueForm({ ...emptyIssueForm, issueDate: new Date().toISOString().slice(0, 10) });
                                      setShowIssueDialog(true);
                                    }}
                                  >
                                    {roll.availablePcs.toLocaleString()}
                                  </button>
                                </td>
                                <td className="border border-slate-300 px-4 py-3" onClick={(event) => event.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button type="button" size="sm" variant="ghost">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem
                                        disabled={roll.availablePcs <= 0}
                                        onClick={() => {
                                          if (roll.availablePcs <= 0) {
                                            toast({ title: "No available stock", description: "Issue cannot be created because there are no available PCS." });
                                            return;
                                          }
                                          setActiveRollId(roll.id);
                                          setIssueForm({ ...emptyIssueForm, issueDate: new Date().toISOString().slice(0, 10) });
                                          setShowIssueDialog(true);
                                        }}
                                      >
                                        Issue
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setActiveRollId(roll.id); setDamageForm({ ...emptyDamageForm, damageDate: new Date().toISOString().slice(0, 10) }); setShowDamageDialog(true); }}>
                                        Damage
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setActiveRollId(roll.id); }}>
                                        <Clock className="mr-2 h-4 w-4" /> Issue History
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setActiveRollId(roll.id); }}>
                                        <Clock className="mr-2 h-4 w-4" /> Damage History
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { startEditRoll(roll); setShowEditDialog(true); }}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteRoll(roll.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {showIssueDialog && selectedRoll ? (
                        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-6 sm:p-6 md:p-8">
                          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">Issue Entry for {selectedRoll.rollNo}</h3>
                                <p className="text-sm text-slate-500">Record issue details for the selected roll.</p>
                              </div>
                              <Button type="button" variant="outline" onClick={() => setShowIssueDialog(false)}>
                                Close
                              </Button>
                            </div>

                            <div className="max-h-[80vh] overflow-y-auto p-5">
                              <form onSubmit={handleIssueSubmit} className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label>Issue Date</Label>
                                  <Input type="date" value={issueForm.issueDate} onChange={(event) => setIssueForm({ ...issueForm, issueDate: event.target.value })} />
                                </div>
                                <div>
                                  <Label>PO Number</Label>
                                  <Input value={issueForm.poNumber} onChange={(event) => setIssueForm({ ...issueForm, poNumber: event.target.value })} placeholder="PO Number" />
                                </div>
                                <div>
                                  <Label>Style Number</Label>
                                  <Input value={issueForm.styleNumber} onChange={(event) => setIssueForm({ ...issueForm, styleNumber: event.target.value })} placeholder="Style Number" />
                                </div>
                                <div>
                                  <Label>Issue PCS</Label>
                                  <Input type="number" min="1" value={issueForm.issuePcs} onChange={(event) => setIssueForm({ ...issueForm, issuePcs: Number(event.target.value) })} placeholder="Issue PCS" />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Remarks</Label>
                                  <Textarea value={issueForm.remarks} onChange={(event) => setIssueForm({ ...issueForm, remarks: event.target.value })} placeholder="Remarks" />
                                </div>
                                <div className="md:col-span-2 flex gap-2">
                                  <Button type="submit">Save Issue</Button>
                                  <Button type="button" variant="outline" onClick={() => setShowIssueDialog(false)}>Cancel</Button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {showDamageDialog && selectedRoll ? (
                        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-6 sm:p-6 md:p-8">
                          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">Damage Entry for {selectedRoll.rollNo}</h3>
                                <p className="text-sm text-slate-500">Record damage details for the selected roll.</p>
                              </div>
                              <Button type="button" variant="outline" onClick={() => setShowDamageDialog(false)}>
                                Close
                              </Button>
                            </div>

                            <div className="max-h-[80vh] overflow-y-auto p-5">
                              <form onSubmit={handleDamageSubmit} className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label>Damage Date</Label>
                                  <Input type="date" value={damageForm.damageDate} onChange={(event) => setDamageForm({ ...damageForm, damageDate: event.target.value })} />
                                </div>
                                <div>
                                  <Label>Damage PCS</Label>
                                  <Input type="number" min="1" value={damageForm.damagePcs} onChange={(event) => setDamageForm({ ...damageForm, damagePcs: Number(event.target.value) })} placeholder="Damage PCS" />
                                </div>
                                <div>
                                  <Label>Damage Reason</Label>
                                  <Input value={damageForm.damageReason} onChange={(event) => setDamageForm({ ...damageForm, damageReason: event.target.value })} placeholder="Damage Reason" />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Remarks</Label>
                                  <Textarea value={damageForm.remarks} onChange={(event) => setDamageForm({ ...damageForm, remarks: event.target.value })} placeholder="Remarks" />
                                </div>
                                <div className="md:col-span-2 flex gap-2">
                                  <Button type="submit" variant="outline">Save Damage</Button>
                                  <Button type="button" variant="secondary" onClick={() => setShowDamageDialog(false)}>Cancel</Button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {showEditDialog && editingRoll ? (
                        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-6 sm:p-6 md:p-8">
                          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">Edit Receive Entry for {editingRoll.rollNo}</h3>
                                <p className="text-sm text-slate-500">Update receive details in a popup dialog.</p>
                              </div>
                              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                                Close
                              </Button>
                            </div>

                            <div className="max-h-[80vh] overflow-y-auto p-5">
                              <form onSubmit={handleEditRollSubmit} className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label>Receive Date</Label>
                                  <Input type="date" value={editReceiveForm.receiveDate} onChange={(event) => setEditReceiveForm({ ...editReceiveForm, receiveDate: event.target.value })} />
                                </div>
                                <div>
                                  <Label>Size</Label>
                                  <Input value={editReceiveForm.size} onChange={(event) => setEditReceiveForm({ ...editReceiveForm, size: event.target.value })} placeholder="Size" />
                                </div>
                                <div>
                                  <Label>PCS Per Roll</Label>
                                  <Input type="number" value={editReceiveForm.pcsPerRoll} onChange={(event) => setEditReceiveForm({ ...editReceiveForm, pcsPerRoll: Number(event.target.value) })} />
                                </div>
                                <div>
                                  <Label>PO Number</Label>
                                  <Input value={editReceiveForm.poNumber} onChange={(event) => setEditReceiveForm({ ...editReceiveForm, poNumber: event.target.value })} placeholder="PO Number" />
                                </div>
                                <div>
                                  <Label>Style Number</Label>
                                  <Input value={editReceiveForm.styleNumber} onChange={(event) => setEditReceiveForm({ ...editReceiveForm, styleNumber: event.target.value })} placeholder="Style Number" />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Remarks</Label>
                                  <Textarea value={editReceiveForm.remarks} onChange={(event) => setEditReceiveForm({ ...editReceiveForm, remarks: event.target.value })} placeholder="Remarks" />
                                </div>
                                <div className="md:col-span-2 flex gap-2">
                                  <Button type="submit">Save Edit</Button>
                                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StickerPrinterManagement;
