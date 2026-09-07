import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Trash2,
  Film,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Lock,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  Eye,
  Video,
  Download,
  ShieldCheck,
  Building2,
  User,
  X,
  AlertCircle,
} from "lucide-react";
import { Grievance, UserProfile, AdminAuditLog, GrievanceStatus } from "../types";
import { Translations } from "../data/translations";

interface AdminControlCenterProps {
  currentUser: UserProfile;
  grievances: Grievance[];
  auditLogs: AdminAuditLog[];
  onOpenDeleteModal: (grievance: Grievance, initialMode?: "all" | "video_only") => void;
  onTrackGrievance: (grievance: Grievance) => void;
  onBulkDelete?: (ids: string[], reason: string) => void;
  t: Translations;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  currentUser,
  grievances,
  auditLogs,
  onOpenDeleteModal,
  onTrackGrievance,
  onBulkDelete,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<"complaints" | "videos" | "audit_trail">("complaints");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState("Administrative Clean-up / Batch Purge");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<{ title: string; url: string } | null>(null);

  // Complaints with video
  const videoComplaints = useMemo(() => {
    return grievances.filter((g) => !!g.videoUrl);
  }, [grievances]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    let list = activeTab === "videos" ? videoComplaints : grievances;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.token.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.locality.toLowerCase().includes(q) ||
          g.ward.toLowerCase().includes(q) ||
          g.filedByName.toLowerCase().includes(q) ||
          g.district.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      list = list.filter((g) => g.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      list = list.filter((g) => g.status === selectedStatus);
    }

    if (selectedDistrict !== "all") {
      list = list.filter((g) => g.district === selectedDistrict);
    }

    return list;
  }, [grievances, videoComplaints, activeTab, searchQuery, selectedCategory, selectedStatus, selectedDistrict]);

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    grievances.forEach((g) => {
      if (g.district) set.add(g.district);
    });
    return Array.from(set);
  }, [grievances]);

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredComplaints.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredComplaints.map((g) => g.id));
    }
  };

  const handleExecuteBulkDelete = () => {
    if (onBulkDelete && selectedItems.length > 0) {
      onBulkDelete(selectedItems, bulkReason);
      setSelectedItems([]);
      setIsBulkDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Admin Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-200" />
                Root Admin Console
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/40">
                ACTIVE PRIVILEGES
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              JanVani Vigilance & Content Deletion Console
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              Super-Administrator access for <strong>{currentUser.name}</strong> ({currentUser.email}).
              Permanent deletion authority for civic complaints, video footage, spam records, and privacy enforcement.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 text-right">
              <div className="text-[10px] uppercase tracking-wider text-red-200 font-bold">Admin Authority</div>
              <div className="text-sm font-bold text-white">Full Purge Permitted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Grievances</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {grievances.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all districts & categories</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Video Evidence Files</span>
            <Film className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
            {videoComplaints.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified civic video uploads</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Audit Logs Count</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {auditLogs.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Immutable deletion events</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Selection</span>
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {selectedItems.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {selectedItems.length > 0 ? "Ready for bulk purge" : "Select via checkboxes"}
          </div>
        </div>
      </div>

      {/* Tab Switcher & Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] self-start">
          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "complaints"
                ? "bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Complaints ({grievances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "videos"
                ? "bg-white dark:bg-[#333] text-orange-600 dark:text-orange-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Files ({videoComplaints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit_trail")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audit_trail"
                ? "bg-white dark:bg-[#333] text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Deletion Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Bulk Delete Trigger */}
        {selectedItems.length > 0 && activeTab !== "audit_trail" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Purge ({selectedItems.length} selected)</span>
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-[#333] text-xs text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {activeTab === "audit_trail" ? (
        /* Deletion Audit Trail Table */
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Immutable Administrative Deletion Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every purge or video removal is cryptographically recorded with operator identity & statutory reason.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target ID / Token</th>
                  <th className="py-2.5 px-3">Justification Reason</th>
                  <th className="py-2.5 px-3">Admin Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No admin deletion records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === "DELETE_COMPLAINT"
                              ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {log.targetToken || log.targetId}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {log.reason}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">{log.adminName}</div>
                        <div className="text-[10px] text-slate-400">{log.adminEmail}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Complaints / Video Management Console */
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by token, title, ward, citizen name..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/[0.08] focus:ring-2 focus:ring-red-500 outline-none text-slate-800 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Roads & Potholes">Roads & Potholes</option>
                  <option value="Garbage & Sanitation">Garbage & Sanitation</option>
                  <option value="Drinking Water & Pipeline Leakage">Drinking Water</option>
                  <option value="Electricity Hazard & Wiring">Electricity</option>
                  <option value="Sewage & Drain Overflow">Sewage & Drain</option>
                  <option value="Streetlight Breakdown">Streetlights</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Work In Progress">Work In Progress</option>
                  <option value="Resolved & Verified">Resolved & Verified</option>
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table / List */}
          <div className="rounded-2xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-white/[0.08] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    filteredComplaints.length > 0 &&
                    selectedItems.length === filteredComplaints.length
                  }
                  onChange={handleSelectAll}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>Showing {filteredComplaints.length} Records</span>
              </div>
              <span className="text-slate-400 text-[11px]">Click red trash icon to delete</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold bg-slate-50/50 dark:bg-white/[0.02]">
                    <th className="py-2.5 px-3 w-8"></th>
                    <th className="py-2.5 px-3">Token & Title</th>
                    <th className="py-2.5 px-3">Location / Ward</th>
                    <th className="py-2.5 px-3">Citizen Info</th>
                    <th className="py-2.5 px-3">Video / Media</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No grievances match the search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((grievance) => {
                      const isSelected = selectedItems.includes(grievance.id);
                      const hasVid = !!grievance.videoUrl;

                      return (
                        <tr
                          key={grievance.id}
                          className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${
                            isSelected ? "bg-red-50/40 dark:bg-red-950/20" : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(grievance.id)}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-mono font-bold text-orange-600 dark:text-orange-400 text-[11px]">
                              {grievance.token}
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white line-clamp-1 text-xs">
                              {grievance.title}
                            </div>
                            <div className="text-[10px] text-slate-400">{grievance.category}</div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="text-slate-800 dark:text-slate-200">{grievance.ward}</div>
                            <div className="text-[10px] text-slate-400">{grievance.district} ({grievance.stateCode})</div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-900 dark:text-white">{grievance.filedByName}</div>
                            <div className="text-[10px] text-slate-400">{grievance.filedByPhone || "Mobile Verified"}</div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {hasVid ? (
                              <button
                                onClick={() =>
                                  setPreviewVideoUrl({
                                    title: grievance.title,
                                    url: grievance.videoUrl!,
                                  })
                                }
                                className="px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold text-[10px] flex items-center gap-1 hover:bg-orange-200 transition-colors cursor-pointer border border-orange-200 dark:border-orange-800/40"
                              >
                                <Video className="w-3 h-3 text-orange-600" />
                                <span>Play Video</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Photo only</span>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                grievance.status === "Resolved & Verified"
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                  : grievance.status === "Work In Progress"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                  : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              {grievance.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Track / View */}
                              <button
                                onClick={() => onTrackGrievance(grievance)}
                                title="View details"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#333] hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Video Only */}
                              {hasVid && (
                                <button
                                  onClick={() => onOpenDeleteModal(grievance, "video_only")}
                                  title="Delete video evidence only"
                                  className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                                >
                                  <Film className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Entire Complaint */}
                              <button
                                onClick={() => onOpenDeleteModal(grievance, "all")}
                                title="Delete entire complaint"
                                className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div
          onClick={() => setPreviewVideoUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-black border border-white/20 overflow-hidden shadow-2xl"
          >
            <div className="p-3 bg-[#1c1c1c] text-white flex items-center justify-between">
              <span className="text-xs font-bold truncate pr-2">{previewVideoUrl.title}</span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={previewVideoUrl.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Dialog */}
      {isBulkDeleteOpen && (
        <div
          onClick={() => setIsBulkDeleteOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#252525] border border-red-300 dark:border-red-900/60 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Bulk Purge
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedItems.length} complaints will be permanently deleted.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Statutory Justification:
              </label>
              <textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1c1c1c] border border-slate-300 dark:border-white/[0.12] outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkDeleteOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer"
              >
                Purge {selectedItems.length} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
