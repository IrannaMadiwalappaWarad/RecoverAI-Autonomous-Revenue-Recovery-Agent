import React, { useEffect, useState } from 'react';
import { 
  ScrollText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Bot, 
  User, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  FileCode
} from 'lucide-react';
import { AuditEvent } from '../types';
import { api } from '../lib/api';

export const AuditTrailPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditEvents(250);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  const filteredEvents = events.filter((ev) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ev.id.toLowerCase().includes(q) ||
      ev.title.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      (ev.caseId && ev.caseId.toLowerCase().includes(q)) ||
      (ev.paymentId && ev.paymentId.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (actorFilter !== 'ALL' && ev.actor !== actorFilter) return false;
    if (severityFilter !== 'ALL' && ev.severity !== severityFilter) return false;

    return true;
  });

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case 'AI_AGENT':
        return <Bot className="w-4 h-4 text-indigo-600" />;
      case 'POLICY_ENGINE':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'MERCHANT':
        return <User className="w-4 h-4 text-amber-600" />;
      case 'RAZORPAY_API':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default:
        return <ScrollText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">SUCCESS</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">WARNING</span>;
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">ERROR</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Immutable Audit Trail</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
              Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete compliance timeline documenting every AI diagnosis, policy check, merchant override, and Razorpay API call.
          </p>
        </div>

        <button
          onClick={fetchAuditEvents}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 self-start sm:self-auto flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case, payment, or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none"
          >
            <option value="ALL">All Actors</option>
            <option value="AI_AGENT">AI Agent (Gemini)</option>
            <option value="POLICY_ENGINE">Policy Engine</option>
            <option value="MERCHANT">Merchant</option>
            <option value="RAZORPAY_API">Razorpay API</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              No audit logs found matching the selected filters.
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="p-3.5 sm:px-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200 flex-shrink-0 mt-0.5">
                    {getActorIcon(ev.actor)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900">{ev.title}</span>
                      {getSeverityBadge(ev.severity)}
                      <span className="text-[10px] font-mono text-slate-400">[{ev.actor}]</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed break-words">{ev.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono pt-0.5">
                      {ev.caseId && <span>Case: {ev.caseId}</span>}
                      {ev.paymentId && <span>Payment: {ev.paymentId}</span>}
                      <span>ID: {ev.id.slice(0, 12)}...</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap block">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {new Date(ev.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Detail Modal / Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Audit Record Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Event ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedEvent.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Actor:</span>
                  <span className="font-medium text-slate-900">{selectedEvent.actor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Event Type:</span>
                  <span className="font-mono text-slate-800">{selectedEvent.eventType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Timestamp:</span>
                  <span className="text-slate-600 font-mono">{new Date(selectedEvent.timestamp).toISOString()}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payload Details:</span>
                <div className="bg-slate-900 p-3.5 rounded-md font-mono text-[11px] text-slate-200 overflow-x-auto max-h-60 border border-slate-800">
                  <pre>{JSON.stringify(selectedEvent.details || { description: selectedEvent.description }, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
