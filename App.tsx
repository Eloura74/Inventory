import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  createContext,
  useCallback,
} from "react";
import {
  LayoutDashboard,
  Box,
  ArrowRightLeft,
  MapPin,
  Users,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  History,
  MessageSquare,
  Bot,
  LogOut,
  ChevronRight,
  TrendingUp,
  PackageCheck,
  PackageX,
  X,
  Menu,
  MoreVertical,
  Trash2,
  Edit,
  Building2,
  UserCircle,
  Download,
  Printer,
  FileSpreadsheet,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Item,
  Location,
  StockMovement,
  User,
  InventoryItem,
  Comment,
  Role,
  MovementType,
  ItemStatus,
  LocationType,
} from "./types";
import { Button } from "./components/Button";
import { Modal } from "./components/Modal";
import { analyzeInventory } from "./services/geminiService";
import { api } from "./services/api";

// --- Context & State Management ---

interface AppState {
  items: Item[];
  locations: Location[];
  movements: StockMovement[];
  comments: Comment[];
  currentUser: User;
}

interface AppContextType extends AppState {
  // Items CRUD
  addItem: (item: Omit<Item, "id">) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  // Locations CRUD
  addLocation: (loc: Omit<Location, "id">) => void;
  deleteLocation: (id: string) => void;

  // Movements & Comments
  addMovement: (
    movement: Omit<StockMovement, "id" | "createdAt" | "createdBy">,
  ) => void;
  addComment: (
    comment: Omit<Comment, "id" | "createdAt" | "createdBy" | "authorName">,
  ) => void;

  // Derived
  inventory: InventoryItem[];
  getCommentsForEntity: (type: string, id: string) => Comment[];
}

const AppContext = createContext<AppContextType | null>(null);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group text-sm border-l-2 relative overflow-hidden ${
      active
        ? "bg-brand-500/10 text-white border-brand-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
        : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 border-transparent"
    }`}
  >
    {active && (
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-50" />
    )}
    <Icon
      size={18}
      className={`relative z-10 ${
        active
          ? "text-brand-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
          : "text-zinc-600 group-hover:text-zinc-300 transition-colors"
      }`}
    />
    <span className="relative z-10 font-medium tracking-wide">{label}</span>
  </button>
);

const StatusBadge = ({ status }: { status: ItemStatus }) => {
  const styles = {
    [ItemStatus.OK]:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    [ItemStatus.LOW]:
      "bg-brand-500/10 text-brand-400 border-brand-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    [ItemStatus.MAINTENANCE]: "bg-zinc-800 text-zinc-400 border-zinc-700",
    [ItemStatus.UNAVAILABLE]: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${styles[status]}`}
    >
      {status}
    </span>
  );
};

const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: any;
  action?: React.ReactNode;
}> = ({ children, className = "", title, icon: Icon, action }) => (
  <div
    className={`bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-xl shadow-glass flex flex-col ${className} card relative overflow-hidden group hover:border-white/10 transition-colors duration-500`}
  >
    {/* Subtle gradient glow on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20 relative z-10">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-brand-500" />}
          {title && (
            <h3 className="text-xs font-bold text-zinc-400 tracking-[0.2em] uppercase">
              {title}
            </h3>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 flex-1 relative z-10">{children}</div>
  </div>
);

// --- DASHBOARD ---
const Dashboard: React.FC = () => {
  const { inventory, movements } = useAppContext();

  const stats = useMemo(() => {
    const totalItems = inventory.reduce((acc, i) => acc + i.currentStock, 0);
    const lowStock = inventory.filter(
      (i) => i.status === ItemStatus.LOW,
    ).length;
    const value = totalItems * 150;
    
    // Calcul des items actuellement en prêt (mouvements OUT récents)
    // On compte le nombre de mouvements OUT uniques par item dans les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeLoans = movements.filter(
      (m) =>
        m.type === MovementType.OUT &&
        new Date(m.createdAt) > thirtyDaysAgo,
    ).length;
    
    return { totalItems, lowStock, value, activeLoans };
  }, [inventory, movements]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + i.currentStock;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const recentMovements = movements
    .slice(0, 7)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 no-print">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">Logistics command center.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Report
          </Button>
        </div>
      </header>

      {/* KPI Cards - Dense Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-glass relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
            <PackageCheck size={100} />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Total Assets
          </p>
          <h3 className="text-4xl font-bold text-white font-mono tracking-tighter">
            {stats.totalItems}
          </h3>
          <p className="text-xs text-emerald-500 mt-3 flex items-center gap-1 font-medium bg-emerald-500/10 w-fit px-2 py-1 rounded-full border border-emerald-500/20">
            <TrendingUp size={12} /> +2% this week
          </p>
        </div>

        <div className="bg-gradient-to-br from-brand-900/20 to-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-brand-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden group hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity duration-500 text-brand-500 transform group-hover:rotate-12">
            <AlertTriangle size={100} />
          </div>
          <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1 shadow-glow">
            Attention Needed
          </p>
          <h3 className="text-4xl font-bold text-white font-mono tracking-tighter">
            {stats.lowStock}
          </h3>
          <p className="text-xs text-brand-400 mt-3 flex items-center gap-1 font-medium bg-brand-500/10 w-fit px-2 py-1 rounded-full border border-brand-500/20">
            Low stock alerts
          </p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-glass relative overflow-hidden group hover:border-white/10 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            <Activity size={100} />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Est. Value
          </p>
          <h3 className="text-4xl font-bold text-white font-mono tracking-tighter">
            ${(stats.value / 1000).toFixed(1)}k
          </h3>
          <p className="text-xs text-zinc-500 mt-3">Inventory valuation</p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-glass relative overflow-hidden group hover:border-white/10 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            <ArrowRightLeft size={100} />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Active Loans
          </p>
          <h3 className="text-4xl font-bold text-white font-mono tracking-tighter">
            {stats.activeLoans}
          </h3>
          <p className="text-xs text-zinc-500 mt-3">Items out (last 30 days)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <Card
          title="Stock Distribution"
          icon={Activity}
          className="xl:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} barSize={40}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  stroke="#71717a"
                  tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  stroke="#71717a"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    backgroundColor: "rgba(9, 9, 11, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#f4f4f5",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#e4e4e7" }}
                />
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="value"
                  fill="url(#goldGradient)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Audit Log" icon={History}>
          <div className="space-y-0 -mx-3">
            {recentMovements.map((m) => (
              <div
                key={m.id}
                className="flex items-center space-x-3 py-2 px-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors group text-sm"
              >
                <div
                  className={`p-1 rounded shrink-0 border ${
                    m.type === MovementType.IN
                      ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/50"
                      : m.type === MovementType.OUT
                        ? "bg-brand-950/50 text-brand-400 border-brand-900/50"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {m.type === MovementType.IN ? (
                    <Plus size={12} />
                  ) : m.type === MovementType.OUT ? (
                    <PackageX size={12} />
                  ) : (
                    <ArrowRightLeft size={12} />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-300 truncate w-32 md:w-auto">
                      {m.type === "IN"
                        ? "Received"
                        : m.type === "OUT"
                          ? "Dispatched"
                          : m.type}{" "}
                      <span className="text-white">{m.quantity}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-auto pt-4 text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-white text-center transition-colors">
            View All Log
          </button>
        </Card>
      </div>
    </div>
  );
};

// --- INVENTORY ---
const Inventory: React.FC = () => {
  const {
    inventory,
    addItem,
    updateItem,
    deleteItem,
    addComment,
    getCommentsForEntity,
  } = useAppContext();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [commentText, setCommentText] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [itemForm, setItemForm] = useState<Partial<Item>>({});

  const filtered = useMemo(() => {
    return inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
    );
  }, [inventory, search]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !commentText.trim()) return;
    addComment({
      entityType: "ITEM",
      entityId: selectedItem.id,
      text: commentText,
    });
    setCommentText("");
  };

  const handleAddNew = () => {
    setEditMode(false);
    setItemForm({
      name: "",
      brand: "",
      model: "",
      category: "General",
      minStockThreshold: 1,
      tags: [],
      description: "",
      imageUrl: "https://picsum.photos/200",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditMode(true);
    setItemForm({ ...item });
    setIsModalOpen(true);
    setSelectedItem(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItem(id);
      setSelectedItem(null);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.category) return;

    if (editMode && itemForm.id) {
      updateItem(itemForm.id, itemForm);
    } else {
      // Extract only the fields accepted by API (no currentStock, no status)
      const { id, currentStock, status, ...validFields } = itemForm;
      addItem(validFields as typeof validFields & { tags: string[] });
    }
    setIsModalOpen(false);
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Brand",
      "Model",
      "Category",
      "Current Stock",
      "Min Threshold",
      "Status",
    ];
    const rows = inventory.map((i) =>
      [
        i.id,
        `"${i.name}"`,
        `"${i.brand}"`,
        `"${i.model}"`,
        `"${i.category}"`,
        i.currentStock,
        i.minStockThreshold,
        i.status,
      ].join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `inventory_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const itemComments = selectedItem
    ? getCommentsForEntity("ITEM", selectedItem.id)
    : [];

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        <header className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 bg-[#0b1120] p-4 rounded border border-slate-800 no-print shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Inventory
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative group flex-1 md:flex-none">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search items..."
                className="w-full md:w-64 pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="gap-2"
            >
              <FileSpreadsheet size={14} /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer size={14} /> PDF
            </Button>
            <Button
              onClick={handleAddNew}
              className="flex items-center gap-2"
              size="sm"
            >
              <Plus size={16} /> Add Item
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-[#0b1120] rounded border border-slate-800 shadow-sm flex flex-col">
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Item Details</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Category</th>
                  <th className="px-4 py-2.5 w-32">Stock Level</th>
                  <th className="px-4 py-2.5 hidden md:table-cell">Status</th>
                  <th className="px-4 py-2.5 hidden lg:table-cell">Brand</th>
                  <th className="px-4 py-2.5 text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-xs">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {item.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs hidden sm:table-cell">
                      {item.category}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="w-full max-w-[140px]">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-white font-mono">
                            {item.currentStock}
                          </span>
                          <span className="text-slate-500">
                            Min: {item.minStockThreshold}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.currentStock === 0
                                ? "bg-red-500"
                                : item.currentStock <= item.minStockThreshold
                                  ? "bg-brand-500"
                                  : "bg-slate-500" // Slate for OK, Brand for Low
                            }`}
                            style={{
                              width: `${Math.min((item.currentStock / (item.minStockThreshold * 3)) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs hidden lg:table-cell">
                      {item.brand}
                    </td>
                    <td className="px-4 py-2.5 text-right no-print">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setSelectedItem(item)}
                          className="h-6 w-6 p-0 flex items-center justify-center"
                        >
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-80 bg-[#0b1120] border-l border-slate-800 p-0 shadow-xl flex flex-col h-full overflow-hidden fixed right-0 top-0 bottom-0 z-40 md:static md:z-0 md:rounded md:border md:shadow-lg animate-in slide-in-from-right duration-300 no-print">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0b1120] sticky top-0">
            <h3 className="font-bold text-white tracking-tight">
              Item Details
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="md:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            <div className="text-center relative">
              <div className="w-24 h-24 mx-auto rounded overflow-hidden bg-slate-900 border border-slate-700 shadow-sm mb-3">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-bold text-base text-white">
                {selectedItem.name}
              </h4>
              <p className="text-xs text-brand-500 font-medium tracking-wide font-mono uppercase">
                {selectedItem.brand} • {selectedItem.model}
              </p>

              <div className="flex justify-center mt-2">
                <StatusBadge status={selectedItem.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block mb-1 font-semibold">
                  Stock
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {selectedItem.currentStock}
                </span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block mb-1 font-semibold">
                  Min
                </span>
                <span className="text-lg font-bold text-slate-300 font-mono">
                  {selectedItem.minStockThreshold}
                </span>
              </div>
            </div>

            <div>
              <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Tags
              </h5>
              <div className="flex flex-wrap gap-1">
                {selectedItem.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded text-[10px] border border-slate-700 border-dashed"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/30 rounded p-3 border border-slate-800/50">
              <h5 className="text-xs font-semibold text-slate-300 mb-1">
                Description
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            {/* Comments Section */}
            <div>
              <h5 className="font-semibold text-xs mb-3 flex items-center gap-2 text-white border-t border-slate-800 pt-4">
                <MessageSquare size={14} className="text-brand-500" /> Activity
                Log
              </h5>
              <div className="space-y-2 mb-3">
                {itemComments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-900 p-2 rounded border border-slate-800"
                  >
                    <div className="flex justify-between mb-1 items-center">
                      <span className="font-bold text-slate-300 text-[10px]">
                        {c.authorName}
                      </span>
                      <span className="text-slate-600 text-[9px] font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{c.text}</p>
                  </div>
                ))}
                {itemComments.length === 0 && (
                  <p className="text-xs text-slate-600 italic text-center py-2">
                    No notes recorded.
                  </p>
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="Add a note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button size="xs" type="submit" className="h-auto">
                  Post
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editMode ? "Edit Item" : "Create New Item"}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Item Name
            </label>
            <input
              required
              className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
              value={itemForm.name || ""}
              onChange={(e) =>
                setItemForm({ ...itemForm, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Brand
              </label>
              <input
                className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                value={itemForm.brand || ""}
                onChange={(e) =>
                  setItemForm({ ...itemForm, brand: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Model
              </label>
              <input
                className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                value={itemForm.model || ""}
                onChange={(e) =>
                  setItemForm({ ...itemForm, model: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Category
              </label>
              <input
                required
                className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                value={itemForm.category || ""}
                onChange={(e) =>
                  setItemForm({ ...itemForm, category: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                min="0"
                className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                value={itemForm.minStockThreshold || 0}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    minStockThreshold: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Image URL
            </label>
            <input
              className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none text-xs font-mono transition-colors"
              value={itemForm.imageUrl || ""}
              onChange={(e) =>
                setItemForm({ ...itemForm, imageUrl: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Description
            </label>
            <textarea
              className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none h-20 transition-colors"
              value={itemForm.description || ""}
              onChange={(e) =>
                setItemForm({ ...itemForm, description: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editMode ? "Save Changes" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- LOCATIONS & CLIENTS MANAGEMENT ---
const LocationsManagement: React.FC = () => {
  const { locations, addLocation, deleteLocation } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLoc, setNewLoc] = useState<{
    name: string;
    type: LocationType;
    parentId: string;
    address: string;
  }>({
    name: "",
    type: "WAREHOUSE",
    parentId: "",
    address: "",
  });

  const internalLocations = locations.filter((l) =>
    ["WAREHOUSE", "ZONE", "RACK"].includes(l.type),
  );
  const externalLocations = locations.filter((l) =>
    ["CLIENT", "EVENT", "ROOM"].includes(l.type),
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation({
      name: newLoc.name,
      type: newLoc.type,
      parentId: newLoc.parentId || undefined,
      address: newLoc.address || undefined,
    });
    setIsModalOpen(false);
    setNewLoc({ name: "", type: "WAREHOUSE", parentId: "", address: "" });
  };

  const LocationCard: React.FC<{ loc: Location }> = ({ loc }) => (
    <div className="bg-[#0b1120] border border-slate-800 rounded p-4 flex justify-between items-center group hover:border-slate-700 transition-colors shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded ${
            loc.type === "WAREHOUSE"
              ? "bg-brand-500/10 text-brand-500"
              : loc.type === "CLIENT"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-slate-800/50 text-slate-400"
          }`}
        >
          {loc.type === "WAREHOUSE" && <Building2 size={18} />}
          {loc.type === "CLIENT" && <UserCircle size={18} />}
          {(loc.type === "ZONE" || loc.type === "RACK") && <Box size={18} />}
          {loc.type === "ROOM" && <MapPin size={18} />}
          {loc.type === "EVENT" && <Users size={18} />}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-200">{loc.name}</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
            {loc.type}
          </p>
        </div>
      </div>
      <button
        onClick={() => deleteLocation(loc.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Locations & Clients
          </h1>
          <p className="text-sm text-slate-500">
            Manage internal storage and external lending destinations.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus size={16} /> Add Location
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Internal Storage */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Building2 className="text-brand-500" size={18} />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Internal Storage
            </h2>
          </div>
          <div className="grid gap-3">
            {internalLocations.map((l) => (
              <LocationCard key={l.id} loc={l} />
            ))}
            {internalLocations.length === 0 && (
              <p className="text-slate-500 italic text-sm">
                No storage locations defined.
              </p>
            )}
          </div>
        </section>

        {/* External / Clients */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Users className="text-emerald-500" size={18} />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Clients & Venues
            </h2>
          </div>
          <div className="grid gap-3">
            {externalLocations.map((l) => (
              <LocationCard key={l.id} loc={l} />
            ))}
            {externalLocations.length === 0 && (
              <p className="text-slate-500 italic text-sm">
                No external clients or rooms defined.
              </p>
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Location / Client"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Name
            </label>
            <input
              required
              className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="e.g. Main Warehouse or John Doe"
              value={newLoc.name}
              onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Type
            </label>
            <select
              className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none"
              value={newLoc.type}
              onChange={(e) =>
                setNewLoc({ ...newLoc, type: e.target.value as LocationType })
              }
            >
              <option value="WAREHOUSE">Warehouse (Storage)</option>
              <option value="ZONE">Zone (Storage)</option>
              <option value="RACK">Rack (Storage)</option>
              <option value="CLIENT">Client (External)</option>
              <option value="ROOM">Room (Internal/External)</option>
              <option value="EVENT">Event (Temporary)</option>
            </select>
          </div>

          {["WAREHOUSE", "ZONE", "RACK"].includes(newLoc.type) && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Parent Location (Optional)
              </label>
              <select
                className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none"
                value={newLoc.parentId}
                onChange={(e) =>
                  setNewLoc({ ...newLoc, parentId: e.target.value })
                }
              >
                <option value="">None (Top Level)</option>
                {locations
                  .filter((l) => l.id !== newLoc.parentId)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {["CLIENT", "EVENT", "ROOM"].includes(newLoc.type) && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Address / Details
              </label>
              <input
                className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500 outline-none"
                placeholder="e.g. 123 Studio Blvd"
                value={newLoc.address}
                onChange={(e) =>
                  setNewLoc({ ...newLoc, address: e.target.value })
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MOVEMENTS ---
const Movements: React.FC = () => {
  const { items, locations, addMovement } = useAppContext();
  const [formData, setFormData] = useState({
    itemId: "",
    type: MovementType.OUT,
    quantity: 1,
    fromLocationId: "",
    toLocationId: "",
    note: "",
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId) return;

    if (
      formData.type === MovementType.TRANSFER &&
      (!formData.fromLocationId || !formData.toLocationId)
    )
      return;
    if (formData.type === MovementType.OUT && !formData.fromLocationId) return;
    if (formData.type === MovementType.IN && !formData.toLocationId) return;

    addMovement({
      itemId: formData.itemId,
      type: formData.type,
      quantity: Number(formData.quantity),
      fromLocationId: formData.fromLocationId || undefined,
      toLocationId: formData.toLocationId || undefined,
      note: formData.note,
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setFormData((prev) => ({ ...prev, quantity: 1, note: "" }));
  };

  const selectedItem = items.find((i) => i.id === formData.itemId);

  const groupedLocations = locations.reduce(
    (acc, loc) => {
      const group = ["CLIENT", "EVENT", "ROOM"].includes(loc.type)
        ? "External / Clients"
        : "Internal Storage";
      if (!acc[group]) acc[group] = [];
      acc[group].push(loc);
      return acc;
    },
    {} as Record<string, Location[]>,
  );

  const renderLocationOptions = () => (
    <>
      <option value="">Select location...</option>
      {Object.entries(groupedLocations).map(
        ([group, locs]: [string, Location[]]) => (
          <optgroup
            key={group}
            label={group}
            className="bg-slate-800 text-slate-300"
          >
            {locs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.type})
              </option>
            ))}
          </optgroup>
        ),
      )}
    </>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20">
            <ArrowRightLeft className="text-brand-500" size={24} />
          </div>
          Record Movement
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Check in, check out, or transfer equipment.
        </p>
      </header>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded flex items-center gap-3 animate-in fade-in duration-300">
          <PackageCheck size={20} />{" "}
          <span className="font-medium text-sm">
            Movement recorded successfully!
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900/40 backdrop-blur-md p-6 md:p-8 rounded-xl border border-white/5 shadow-glass space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        {/* Type Selection */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
            Movement Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(MovementType).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, type: t })}
                className={`py-3 text-xs font-bold uppercase tracking-wide rounded-lg border-2 transition-all duration-200 ${
                  formData.type === t
                    ? "bg-brand-500/10 border-brand-500 text-brand-400 shadow-lg shadow-brand-500/20"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Item Selection */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
              Item
            </label>
            <div className="relative group">
              <select
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3.5 text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all appearance-none text-sm group-hover:border-zinc-700"
                value={formData.itemId}
                onChange={(e) =>
                  setFormData({ ...formData, itemId: e.target.value })
                }
                required
              >
                <option value="">Select an item...</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.model})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-500 group-hover:text-brand-400 transition-colors">
                <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
            {selectedItem && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-gradient-to-r from-zinc-900 to-zinc-900/50 rounded-lg border border-zinc-800/50 shadow-inner">
                <img
                  src={selectedItem.imageUrl}
                  className="w-12 h-12 rounded-lg object-cover border border-white/5 shadow-sm"
                  alt=""
                />
                <div>
                  <div className="text-sm font-bold text-white tracking-tight">
                    {selectedItem.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedItem.category} • Current Stock:{" "}
                    <span
                      className={`font-mono font-bold ${selectedItem.currentStock <= selectedItem.minStockThreshold ? "text-red-400" : "text-brand-400"}`}
                    >
                      {selectedItem.currentStock}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3.5 text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-sm font-mono placeholder:text-zinc-700"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
            />
          </div>
        </div>

        {/* Locations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(formData.type === MovementType.OUT ||
            formData.type === MovementType.TRANSFER) && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                From Location
              </label>
              <div className="relative group">
                <select
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3.5 text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all appearance-none text-sm group-hover:border-zinc-700"
                  value={formData.fromLocationId}
                  onChange={(e) =>
                    setFormData({ ...formData, fromLocationId: e.target.value })
                  }
                  required
                >
                  {renderLocationOptions()}
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-500 group-hover:text-brand-400 transition-colors">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>
          )}

          {(formData.type === MovementType.IN ||
            formData.type === MovementType.TRANSFER) && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                To Location
              </label>
              <div className="relative group">
                <select
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3.5 text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all appearance-none text-sm group-hover:border-zinc-700"
                  value={formData.toLocationId}
                  onChange={(e) =>
                    setFormData({ ...formData, toLocationId: e.target.value })
                  }
                  required
                >
                  {renderLocationOptions()}
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-500 group-hover:text-brand-400 transition-colors">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
            Comment / Reference
          </label>
          <textarea
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all h-24 resize-none text-sm placeholder:text-zinc-700"
            placeholder="E.g., Order #1234 or Event TechConf"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="pt-2 relative z-10">
          <Button
            type="submit"
            className="w-full py-4 text-base font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all duration-200"
            size="lg"
          >
            <PackageCheck size={20} className="mr-2" />
            Confirm Movement
          </Button>
        </div>
      </form>
    </div>
  );
};

// --- GEMINI AI ASSISTANT ---
const AIAssistant: React.FC = () => {
  const { inventory, movements } = useAppContext();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse("");

    // Simulate API delay slightly if needed, but analyzeInventory calls actual Gemini
    const result = await analyzeInventory(query, inventory, movements);

    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded border border-brand-500/20">
            <Bot className="text-brand-500" />
          </div>
          AI Inventory Analyst
        </h1>
        <p className="text-slate-400">
          Ask questions about your stock levels, trends, or specific items.
        </p>
      </header>

      <div className="bg-[#0b1120] p-6 rounded border border-slate-800 shadow-sm">
        <form onSubmit={handleAsk} className="relative mb-6">
          <input
            type="text"
            placeholder="E.g., 'Which items are running low?' or 'Summarize recent camera movements'"
            className="w-full bg-[#020617] border border-slate-700 rounded pl-5 pr-14 py-4 text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none shadow-inner transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 p-2 bg-brand-600 text-white rounded hover:bg-brand-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </form>

        {(response || loading) && (
          <div className="bg-[#020617] rounded p-6 min-h-[100px] border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
            {loading ? (
              <div className="flex items-center gap-3 text-brand-400 animate-pulse">
                <Bot size={20} />
                <span className="font-medium">Analyzing inventory data...</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                <div className="whitespace-pre-wrap">{response}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          "Show me low stock items",
          "Suggest a restocking plan",
          "Last movement for Sony Alpha?",
          "Total inventory value",
        ].map((q) => (
          <button
            key={q}
            onClick={() => setQuery(q)}
            className="p-4 bg-[#0b1120] border border-slate-800 rounded text-sm text-slate-400 hover:border-brand-500/50 hover:text-brand-400 hover:bg-[#151f32] text-left transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- APP SHELL & LOGIC ---

enum Screen {
  DASHBOARD = "DASHBOARD",
  INVENTORY = "INVENTORY",
  MOVEMENTS = "MOVEMENTS",
  LOCATIONS = "LOCATIONS",
  AI = "AI",
}

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAppContext();

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.DASHBOARD:
        return <Dashboard />;
      case Screen.INVENTORY:
        return <Inventory />;
      case Screen.MOVEMENTS:
        return <Movements />;
      case Screen.LOCATIONS:
        return <LocationsManagement />;
      case Screen.AI:
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  const handleNav = (screen: Screen) => {
    setCurrentScreen(screen);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-300 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Sidebar - Desktop with ambient texture */}
      <aside
        className={`w-64 sidebar-bg border-r border-slate-800 fixed h-full z-20 transition-transform duration-300 ease-in-out transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col no-print shadow-2xl`}
      >
        <div className="relative z-10 p-5 border-b border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 font-bold text-lg text-white tracking-wide">
            <div className="bg-brand-600 p-1.5 rounded shadow-lg shadow-brand-500/30">
              <Box size={20} className="text-white" />
            </div>
            StockFlow
          </div>
        </div>

        <nav className="relative z-10 flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar backdrop-blur-[2px]">
          <div className="mb-4">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Main
            </p>
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={currentScreen === Screen.DASHBOARD}
              onClick={() => handleNav(Screen.DASHBOARD)}
            />
            <SidebarItem
              icon={Box}
              label="Inventory"
              active={currentScreen === Screen.INVENTORY}
              onClick={() => handleNav(Screen.INVENTORY)}
            />
            <SidebarItem
              icon={ArrowRightLeft}
              label="Movements"
              active={currentScreen === Screen.MOVEMENTS}
              onClick={() => handleNav(Screen.MOVEMENTS)}
            />
          </div>

          <div className="mb-4">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Management
            </p>
            <SidebarItem
              icon={MapPin}
              label="Locations & Clients"
              active={currentScreen === Screen.LOCATIONS}
              onClick={() => handleNav(Screen.LOCATIONS)}
            />
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Intelligence
            </p>
            <SidebarItem
              icon={Bot}
              label="AI Analyst"
              active={currentScreen === Screen.AI}
              onClick={() => handleNav(Screen.AI)}
            />
          </div>
        </nav>

        <div className="relative z-10 p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3 px-2 py-2 rounded hover:bg-white/10 transition-colors cursor-pointer group">
            <img
              src={currentUser.avatar}
              alt="User"
              className="w-8 h-8 rounded bg-slate-700 border border-slate-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">
                {currentUser.role}
              </p>
            </div>
            <LogOut size={16} className="text-slate-500 hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden relative max-w-[1920px]">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-[#0b1120] border border-slate-800 p-4 rounded sticky top-4 z-10 shadow-lg no-print">
          <div className="font-bold text-lg text-white flex items-center gap-2">
            <Box size={20} className="text-brand-500" /> StockFlow
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            <Menu size={24} />
          </button>
        </div>

        {renderScreen()}
      </main>
    </div>
  );
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Mock User pour l'instant (Auth à venir)
  const [currentUser] = useState<User>({
    id: "user1",
    name: "Quentin",
    email: "quentin@stockflow.pro",
    role: Role.ADMIN,
    avatar: "https://ui-avatars.com/api/?name=Quentin&background=random",
  });

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching API data...");
        const [fetchedItems, fetchedLocs, fetchedMovs, fetchedComments] = await Promise.all([
          api.items.list().catch((e) => {
            console.error("Items fetch failed", e);
            return [];
          }),
          api.locations.list().catch((e) => {
            console.error("Locs fetch failed", e);
            return [];
          }),
          api.movements.list().catch((e) => {
            console.error("Movs fetch failed", e);
            return [];
          }),
          api.comments.list().catch((e) => {
            console.error("Comments fetch failed", e);
            return [];
          }),
        ]);

        console.log("Data fetched:", { fetchedItems, fetchedLocs, fetchedComments });
        setItems(fetchedItems);
        setLocations(fetchedLocs);
        setMovements(fetchedMovs);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Critical Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derive Inventory State
  // L'API met à jour currentStock automatiquement lors des mouvements
  // On utilise donc directement la valeur de la DB (source de vérité)
  const inventory: InventoryItem[] = useMemo(() => {
    return items.map((item) => ({
      ...item,
      currentStock: item.currentStock || 0,
    }));
  }, [items]);

  // --- CRUD Handlers ---

  const addItem = useCallback(async (itemData: Omit<Item, "id">) => {
    try {
      const created = await api.items.create(itemData);
      setItems((prev) => [...prev, created]);
    } catch (err) {
      console.error("Failed to add item", err);
      // Fallback or Toast here
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    try {
      const updated = await api.items.update(id, updates);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await api.items.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addLocation = useCallback(async (locData: Omit<Location, "id">) => {
    try {
      const created = await api.locations.create(locData);
      setLocations((prev) => [...prev, created]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    try {
      await api.locations.delete(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addMovement = useCallback(
    async (
      movementData: Omit<StockMovement, "id" | "createdAt" | "createdBy">,
    ) => {
      try {
        const created = await api.movements.create({
          ...movementData,
          itemId: movementData.itemId,
        });
        setMovements((prev) => [created, ...prev]);
        // Refresh items to get updated stock instantly
        const updatedItems = await api.items.list(); // Simple re-fetch strategy for consistency
        setItems(updatedItems);
      } catch (e) {
        console.error(e);
      }
    },
    [],
  );

  const addComment = useCallback(
    async (
      commentData: Omit<
        Comment,
        "id" | "createdAt" | "createdBy" | "authorName"
      >,
    ) => {
      try {
        // Créer le commentaire via l'API
        const created = await api.comments.create({
          text: commentData.text,
          entityType: commentData.entityType,
          entityId: commentData.entityId,
        });
        // Ajouter au state local
        setComments((prev) => [created, ...prev]);
      } catch (e) {
        console.error("Failed to add comment", e);
      }
    },
    [],
  );

  const getCommentsForEntity = useCallback(
    (type: string, id: string) => {
      return comments
        .filter((c) => c.entityType === type && c.entityId === id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    [comments],
  );

  return (
    <AppContext.Provider
      value={{
        items,
        locations,
        movements,
        comments,
        currentUser,
        inventory,
        addItem,
        updateItem,
        deleteItem,
        addLocation,
        deleteLocation,
        addMovement,
        addComment,
        getCommentsForEntity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
