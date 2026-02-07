import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  Search, RefreshCcw, Ticket, CheckCircle2, AlertCircle, User, 
  Phone, MoreVertical, Filter, Download, ChevronLeft, ChevronRight,
  Trash2, CheckSquare, ArrowUpDown, X
} from "lucide-react";

export default function AdvancedTicketTable() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const itemsPerPage = 10;

  const fetchTickets = () => {
    setLoading(true);
    axios.post("https://balajidryfruits.com/scanner_admin/create_QR.php", { action: "get_all" })
      .then((res) => { if (res.data.success) setTickets(res.data.data); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  // Sorting Logic
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Filter & Sort Pipeline
  const processedTickets = useMemo(() => {
    let result = tickets.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.mobile_number.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || t.payment_status?.toLowerCase() === paymentFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesPayment;
    });

    return result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tickets, searchTerm, statusFilter, paymentFilter, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(processedTickets.length / itemsPerPage);
  const paginatedTickets = processedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedTickets.length === paginatedTickets.length) setSelectedTickets([]);
    else setSelectedTickets(paginatedTickets.map(t => t.id));
  };

  const toggleSelectOne = (id) => {
    if (selectedTickets.includes(id)) setSelectedTickets(selectedTickets.filter(item => item !== id));
    else setSelectedTickets([...selectedTickets, id]);
  };

  // Export CSV Helper
  const exportCSV = () => {
    const headers = ["Name,Mobile,Ticket#,Status,Payment,Qty\n"];
    const rows = processedTickets.map(t => `${t.name},${t.mobile_number},${t.ticket_number},${t.status},${t.payment_status},${t.number_of_ticket}\n`);
    const blob = new Blob([headers + rows.join("")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tickets_Export_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Attendee Database</h1>
            <p className="text-slate-500 text-sm font-medium">Manage entries, payments, and digital pass statuses.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchTickets} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-sm">
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition shadow-sm">
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (Contextual) */}
        {selectedTickets.length > 0 && (
          <div className="bg-indigo-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
               <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{selectedTickets.length} Selected</span>
               <p className="text-sm font-medium hidden md:block">Bulk actions available for selected attendees</p>
            </div>
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition">
                 <CheckSquare size={16} /> Mark as Paid
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-sm font-bold transition">
                 <Trash2 size={16} /> Delete
               </button>
               <button onClick={() => setSelectedTickets([])} className="p-2 hover:bg-white/10 rounded-lg">
                 <X size={20} />
               </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMiniCard label="Total" value={tickets.length} color="indigo" />
          <StatMiniCard label="Scanned" value={tickets.filter(t => t.status === 'scanned').length} color="blue" />
          <StatMiniCard label="Unpaid" value={tickets.filter(t => t.payment_status?.toLowerCase() === 'unpaid').length} color="rose" />
          <StatMiniCard label="Revenue" value={`₹${tickets.filter(t => t.payment_status?.toLowerCase() === 'paid').length * 500}`} color="emerald" />
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by Name, Ticket ID, or Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="unscanned">Unscanned</option>
                  <option value="scanned">Scanned</option>
                </select>
                <select 
                  value={paymentFilter} 
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actual Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0} onChange={toggleSelectAll} className="rounded accent-indigo-600" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('name')}>
                    Attendee <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:text-indigo-600" onClick={() => handleSort('ticket_number')}>
                    Ticket ID <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className={`group hover:bg-slate-50 transition ${selectedTickets.includes(ticket.id) ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedTickets.includes(ticket.id)} onChange={() => toggleSelectOne(ticket.id)} className="rounded accent-indigo-600" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                          {ticket.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{ticket.name}</div>
                          <div className="text-xs text-slate-400">{ticket.mobile_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-mono font-bold text-indigo-600 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                        {ticket.ticket_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        ticket.status === 'scanned' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${
                        ticket.payment_status?.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {ticket.payment_status?.toLowerCase() === 'paid' ? '✓ Paid' : '× Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition hover:bg-white rounded-xl border border-transparent hover:border-slate-200">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-5 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400">
              PAGE {currentPage} OF {totalPages || 1} — {processedTickets.length} TOTAL RECORDS
            </p>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'hover:bg-white text-slate-400'}`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 3), currentPage + 2)}
              <button 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, color }) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50",
    blue: "text-blue-600 bg-blue-50",
    rose: "text-rose-600 bg-rose-50",
    emerald: "text-emerald-600 bg-emerald-50"
  };
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <p className={`text-xl font-black mt-1 ${colors[color].split(' ')[0]}`}>{value}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-100 rounded"></div></td>
      <td className="px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded-xl"></div></td>
      <td className="px-6 py-4"><div className="h-8 w-20 bg-slate-100 rounded-lg mx-auto"></div></td>
      <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
      <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto"></div></td>
    </tr>
  );
}