"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bot,
  ShieldCheck,
  ShieldX,
  CircleCheck,
  CircleX,
  Loader2,
  ChevronRight,
  ChevronDown,
  TriangleAlert,
  PackageSearch,
  Brain,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  Info,
  Sparkles,
  MapPin,
  Users,
  Package,
  Hash,
  Clock,
  Target,
  Send,
  MessageSquare,
  FileText,
  User,
} from "lucide-react";
import { useTwinStore } from "@/store/twinStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AllocatedResource {
  item_id: string;
  name: string;
  quantity: number;
}

interface Recommendation {
  target_unit_id?: string;
  target_unit_name?: string;
  destination_ward?: string;
  destination?: string;
  allocated_resources?: AllocatedResource[];
}

interface AiProposedPlan {
  directive_id?: string;
  timestamp?: string;
  priority_level?: string;
  incident_ref?: string;
  action_type?: string;
  recommendation?: Recommendation;
  ai_reasoning?: string;
  confidence_score?: number;
  // Legacy fields
  recommended_resources?: Array<{ resource_id: string; quantity: number }>;
  reasoning?: string;
  confidence?: "high" | "medium" | "low" | string;
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

interface ValidationResult {
  valid?: boolean;
  checks?: ValidationCheck[];
  errors?: string[];
  validated_at?: string;
}

interface DecisionSnapshot {
  id: string;
  incident_ref: string;
  disaster_type: string;
  priority_level: string;
  injury_severity: string;
  status: string;
  ai_proposed_plan?: AiProposedPlan | null;
  validation_result?: ValidationResult | null;
  procedure_payload?: Record<string, unknown>;
  created_at: string;
  is_demo?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE = "http://localhost:8000";
const MOCK_OFFICER_ID = "officer-id-123";

const SOS_ENTITY_TYPES = new Set(["sos_report", "sos"]);
const SOS_CATEGORIES = new Set(["sos"]);

function isSosIncident(entity: { entity_type?: string; category?: string; symbol?: string }): boolean {
  if (SOS_ENTITY_TYPES.has(entity.entity_type ?? "")) return true;
  if (SOS_CATEGORIES.has(entity.category ?? "")) return true;
  if ((entity.symbol ?? "").toLowerCase().includes("sos")) return true;
  return false;
}

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-welcome",
    role: "ai",
    content:
      "Hello Officer. I am your Sahayak AI Intelligence Assistant. Ask me about live flood telemetry, field workforce deployment status, or resource reserves across the disaster zone.",
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTED_QUESTIONS = [
  "How many people evacuated from Ward 1?",
  "Which NDRF units are currently on Standby?",
  "What is the flood depth near Kalundre River?",
];

// ---------------------------------------------------------------------------
// Helper sub-components & formatters
// ---------------------------------------------------------------------------

const formatId = (id: string) => (id?.length > 12 ? id.slice(0, 8).toUpperCase() : id);

const formatDestination = (dest?: string) => {
  if (!dest) return "";
  const isUuidOrHex = /^[0-9a-fA-F-]{16,}$/.test(dest.trim());
  if (isUuidOrHex || (dest.length > 20 && !dest.includes(" "))) {
    return formatId(dest);
  }
  return dest;
};

function ConfidenceBadge({ score, level }: { score?: number; level?: string }) {
  if (score !== undefined) {
    const color =
      score >= 85
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : score >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
        <Zap size={11} />
        {score}% confidence
      </span>
    );
  }
  const safeLevel = (level || "medium").toLowerCase();
  const cfg =
    {
      high: "bg-emerald-50 text-emerald-700 border-emerald-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      low: "bg-rose-50 text-rose-700 border-rose-200",
    }[safeLevel] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg}`}>
      <Zap size={11} />
      {safeLevel} confidence
    </span>
  );
}

function ValidationCheckRow({ check }: { check: ValidationCheck }) {
  const label: Record<string, string> = {
    schema_integrity: "Schema Integrity",
    resource_availability: "Inventory Availability",
    procedure_compliance: "Procedure Compliance",
  };
  return (
    <div
      className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
        check.passed ? "bg-emerald-50/50 border-emerald-200" : "bg-rose-50/50 border-rose-200"
      }`}
    >
      {check.passed ? (
        <CircleCheck size={15} className="text-emerald-600 mt-0.5 shrink-0" />
      ) : (
        <CircleX size={15} className="text-rose-600 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${check.passed ? "text-emerald-800" : "text-rose-800"}`}>
          {label[check.name] ?? check.name}
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{check.details}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-slate-900">{icon}</span>
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">{label}</h4>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium shrink-0">{label}</span>
        <span className="text-[11px] text-slate-900 font-semibold text-right truncate">{value}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Validation Section
// ---------------------------------------------------------------------------
function ValidationSection({ validationResult }: { validationResult: ValidationResult }) {
  const isValid = Boolean(validationResult.valid);
  const checks = Array.isArray(validationResult.checks) ? validationResult.checks : [];
  const errors = Array.isArray(validationResult.errors) ? validationResult.errors : [];

  const [expanded, setExpanded] = useState(!isValid);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-900">
            <ShieldCheck size={14} />
          </span>
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
            Deterministic Validation
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {isValid ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
              <CircleCheck size={12} />
              Passed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700">
              <CircleX size={12} />
              {errors.length} failure{errors.length !== 1 ? "s" : ""}
            </span>
          )}
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div className="h-px bg-slate-200 -mt-0.5" />

      {expanded && (
        <div className="space-y-1.5 pt-0.5">
          {checks.length > 0 ? (
            checks.map((check) => <ValidationCheckRow key={check.name} check={check} />)
          ) : (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 flex items-start gap-2">
              <TriangleAlert size={14} className="text-rose-600 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-700 leading-snug">
                Validation data missing or API error. Checks could not be completed.
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-1.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                Constraint Violations
              </p>
              <ul className="space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ChevronRight size={11} className="text-rose-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-rose-700 leading-snug">{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Plan Display
// ---------------------------------------------------------------------------
function AiPlanDisplay({ aiPlan }: { aiPlan: AiProposedPlan }) {
  const isNewSchema = Boolean(aiPlan.directive_id || aiPlan.action_type || aiPlan.recommendation);

  if (isNewSchema) {
    const rec = aiPlan.recommendation ?? {};
    const resources = Array.isArray(rec.allocated_resources) ? rec.allocated_resources : [];
    const priorityColor =
      (aiPlan.priority_level ?? "").toUpperCase() === "CRITICAL"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

    return (
      <div className="space-y-2">
        <SectionHeader icon={<Brain size={14} />} label="AI Directive" />

        {/* Directive Header Card */}
        <div className="rounded-lg bg-white border border-slate-200 p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Hash size={11} className="text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-900 tracking-wider font-mono">
                {aiPlan.directive_id ? formatId(aiPlan.directive_id) : "—"}
              </span>
            </div>
            {aiPlan.priority_level && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${priorityColor}`}>
                {aiPlan.priority_level}
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            {aiPlan.action_type && (
              <MetaRow
                icon={<Target size={11} />}
                label="Action Type"
                value={
                  <span className="text-slate-900 font-mono text-[11px] font-semibold">
                    {aiPlan.action_type.replace(/_/g, " ")}
                  </span>
                }
              />
            )}
            {aiPlan.incident_ref && (
              <MetaRow icon={<MapPin size={11} />} label="Incident Ref" value={formatId(aiPlan.incident_ref)} />
            )}
            {aiPlan.timestamp && (
              <MetaRow
                icon={<Clock size={11} />}
                label="Timestamp"
                value={new Date(aiPlan.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              />
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Confidence</span>
              <ConfidenceBadge score={aiPlan.confidence_score} />
            </div>
          </div>
        </div>

        {/* Dispatch Target */}
        {(rec.target_unit_name || rec.destination_ward || rec.destination) && (
          <div className="rounded-lg bg-white border border-slate-200 p-3 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={11} className="text-slate-700" />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Dispatch Target</span>
            </div>
            {rec.target_unit_name && (
              <MetaRow icon={<Users size={11} />} label="Unit" value={rec.target_unit_name} />
            )}
            {rec.target_unit_id && (
              <MetaRow icon={<Hash size={11} />} label="Unit ID" value={<span className="font-mono">{formatId(rec.target_unit_id)}</span>} />
            )}
            {(rec.destination_ward || rec.destination) && (
              <MetaRow
                icon={<MapPin size={11} />}
                label="Destination"
                value={formatDestination(rec.destination_ward || rec.destination)}
              />
            )}
          </div>
        )}

        {/* Allocated Resources */}
        {resources.length > 0 && (
          <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Package size={11} className="text-slate-700" />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Allocated Resources</span>
            </div>
            <div className="space-y-1.5">
              {resources.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded bg-slate-50 border border-slate-200"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-900 font-medium truncate">{r.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{formatId(r.item_id)}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full shrink-0">
                    ×{r.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        {aiPlan.ai_reasoning && (
          <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Info size={11} className="text-slate-700" />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Agent Reasoning</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">{aiPlan.ai_reasoning}</p>
          </div>
        )}
      </div>
    );
  }

  // Legacy schema fallback
  const recommendedResources = Array.isArray(aiPlan.recommended_resources) ? aiPlan.recommended_resources : [];
  return (
    <div className="space-y-2">
      <SectionHeader icon={<Brain size={14} />} label="AI Proposed Plan" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-600">Lyzr Agent Confidence</span>
        <ConfidenceBadge level={aiPlan.confidence} />
      </div>

      {aiPlan.reasoning && (
        <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Info size={11} className="text-slate-700" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Agent Reasoning</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{aiPlan.reasoning}</p>
        </div>
      )}

      {recommendedResources.length > 0 && (
        <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Package size={11} className="text-slate-700" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Recommended Allocations</span>
          </div>
          <div className="space-y-1.5">
            {recommendedResources.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-800 font-medium truncate max-w-[190px]">{r.resource_id}</span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full shrink-0">
                  ×{r.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Interface Component ("Ask AI" View)
// ---------------------------------------------------------------------------
function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const resp = await fetch(`${API_BASE}/api/v1/ai-decision/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!resp.ok) {
        let errText = `Server error (${resp.status})`;
        try {
          const errData = await resp.json();
          errText = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
        } catch {
          const raw = await resp.text();
          if (raw) errText = raw;
        }
        throw new Error(errText);
      }

      const data = await resp.json();
      const aiReply = data?.reply || "No response received from intelligence assistant.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: aiReply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorDetail = err instanceof Error ? err.message : "Chat connection error.";
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "ai",
        content: `⚠️ Intelligence assistant unavailable: ${errorDetail}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white rounded-br-none shadow-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div
                className={`text-[9px] mt-1 font-mono ${
                  msg.role === "user" ? "text-slate-300 text-right" : "text-slate-400 text-left"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User size={12} className="text-slate-700" />
              </div>
            )}
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2.5 justify-start items-center">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none px-3.5 py-2.5 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="text-[10px] text-slate-600 font-semibold ml-1.5">AI is analyzing…</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestion Pills */}
      {messages.length <= 2 && (
        <div className="px-3.5 pb-2 pt-1 flex flex-wrap gap-1.5 border-t border-slate-200 bg-slate-100">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(q);
              }}
              className="text-[10px] bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 px-2 py-1 rounded-md border border-slate-300 hover:border-slate-400 transition-all truncate max-w-full text-left shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about live flood levels, NDRF units, evacuations…"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
          >
            {isTyping ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function CommandCenter() {
  const selectedEntity = useTwinStore((s) => s.selectedEntity);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"plan" | "chat">("plan");

  const [snapshot, setSnapshot] = useState<DecisionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error" | "stale"; message: string } | null>(null);
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const resetPlanState = useCallback(() => {
    setSnapshot(null);
    setError(null);
    setActionResult(null);
    setRejectPromptOpen(false);
    setRejectReason("");
  }, []);

  const [prevEntityId, setPrevEntityId] = useState<string | undefined>(selectedEntity?.id);

  // ── Auto-Reset on Pin Change ───────────────────────────────────────────────
  if (selectedEntity?.id !== prevEntityId) {
    setPrevEntityId(selectedEntity?.id);
    setSnapshot(null);
    setError(null);
    setActionResult(null);
    setRejectPromptOpen(false);
    setRejectReason("");
  }

  // ── Request AI Plan (Live API) ───────────────────────────────────────────
  const handleRequestPlan = useCallback(async () => {
    if (!selectedEntity) return;
    resetPlanState();
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/v1/ai-decision/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_ref: selectedEntity.id, disaster_type: "flood" }),
      });

      if (!resp.ok) {
        let errorMsg = `Server error (Status: ${resp.status})`;
        try {
          const errorData = await resp.json();
          errorMsg = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail ?? errorData);
        } catch {
          const raw = await resp.text();
          if (raw) errorMsg = raw;
        }
        throw new Error(errorMsg);
      }

      const data = await resp.json();
      if (!data || typeof data !== "object" || !data.id) {
        throw new Error("Invalid response format received from AI Decision API.");
      }
      setSnapshot(data as DecisionSnapshot);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, resetPlanState]);

  // ── Simulate AI Plan (Demo Mode) ─────────────────────────────────────────
  const handleSimulateDemoPlan = useCallback(async () => {
    if (!selectedEntity) return;
    resetPlanState();
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/v1/ai-decision/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_ref: selectedEntity.id,
          disaster_type: "flood",
          priority_level: "high",
          injury_severity: "critical",
        }),
      });

      if (!resp.ok) {
        let errorMsg = `Server error (Status: ${resp.status})`;
        try {
          const errorData = await resp.json();
          errorMsg = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail ?? errorData);
        } catch {
          const raw = await resp.text();
          if (raw) errorMsg = raw;
        }
        throw new Error(errorMsg);
      }

      const data = await resp.json();
      if (!data || typeof data !== "object" || !data.id) {
        throw new Error("Invalid response format received from AI Decision API.");
      }
      setSnapshot(data as DecisionSnapshot);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, resetPlanState]);

  // ── Approve Plan ─────────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!snapshot?.id) {
      const msg = "No active decision snapshot found to approve.";
      setActionResult({ type: "error", message: msg });
      alert(msg);
      return;
    }

    setLoadingAction("approve");
    setActionResult(null);

    const snapshotId = snapshot.id;
    const officerId = MOCK_OFFICER_ID || "officer-123";

    try {
      const resp = await fetch(
        `${API_BASE}/api/v1/ai-decision/${snapshotId}/approve?officer_id=${encodeURIComponent(officerId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ officer_id: officerId }),
        }
      );

      if (resp.status === 409) {
        const data = await resp.json();
        const reason =
          data?.detail?.message ||
          data?.detail?.staleness?.reason ||
          "Live conditions have changed.";
        const msg = `Plan stale — ${reason} Please re-run AI analysis.`;
        setActionResult({
          type: "stale",
          message: msg,
        });
        alert(`Warning: ${msg}`);
        return;
      }

      if (!resp.ok) {
        let errorMsg = `Approval failed (${resp.status})`;
        try {
          const errorData = await resp.json();
          errorMsg =
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail ?? errorData);
        } catch {
          const raw = await resp.text();
          if (raw) errorMsg = raw;
        }
        throw new Error(errorMsg);
      }

      const data = await resp.json();
      setSnapshot((prev) => (prev ? { ...prev, status: "approved" } : prev));
      const ticketId = data?.ticket?.id?.slice(0, 8) ?? "created";
      setActionResult({
        type: "success",
        message: `✓ Plan approved. Audit ticket logged (${ticketId}...).`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Approval failed.";
      setActionResult({ type: "error", message: errorMsg });
      alert(`Approval Error: ${errorMsg}`);
    } finally {
      setLoadingAction(null);
    }
  }, [snapshot]);

  // ── Reject Plan ──────────────────────────────────────────────────────────
  const handleReject = useCallback(async () => {
    if (!snapshot?.id) {
      const msg = "No active decision snapshot found to reject.";
      setActionResult({ type: "error", message: msg });
      alert(msg);
      return;
    }
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejecting the plan.");
      return;
    }

    setLoadingAction("reject");
    setActionResult(null);

    const snapshotId = snapshot.id;
    const officerId = MOCK_OFFICER_ID || "officer-123";
    const reasonText = rejectReason.trim();

    try {
      const resp = await fetch(
        `${API_BASE}/api/v1/ai-decision/${snapshotId}/reject?officer_id=${encodeURIComponent(officerId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ officer_id: officerId, reason: reasonText }),
        }
      );

      if (!resp.ok) {
        let errorMsg = `Rejection failed (${resp.status})`;
        try {
          const errorData = await resp.json();
          errorMsg =
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail ?? errorData);
        } catch {
          const raw = await resp.text();
          if (raw) errorMsg = raw;
        }
        throw new Error(errorMsg);
      }

      setSnapshot((prev) => (prev ? { ...prev, status: "rejected" } : prev));
      setActionResult({
        type: "error",
        message: `✗ Plan rejected: "${reasonText}". Reversion logged to tickets table.`,
      });
      setRejectPromptOpen(false);
      setRejectReason("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Rejection failed.";
      setActionResult({ type: "error", message: errorMsg });
      alert(`Rejection Error: ${errorMsg}`);
    } finally {
      setLoadingAction(null);
    }
  }, [snapshot, rejectReason]);

  // ── Derived state ────────────────────────────────────────────────────────
  const isDecisionFinalized = snapshot?.status === "approved" || snapshot?.status === "rejected";
  const validationResult = snapshot?.validation_result;
  const validationErrors = Array.isArray(validationResult?.errors) ? validationResult.errors : [];
  const isPlanValid = Boolean(validationResult?.valid);
  const aiPlan = snapshot?.ai_proposed_plan;

  const isActionableIncident = selectedEntity ? isSosIncident(selectedEntity) : false;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans select-none overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-3.5 pb-2.5 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white shadow-sm">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">AI Command Center</h2>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Lyzr Decision Engine · Flood Response
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation Bar ────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mt-3 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeTab === "plan"
                ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <FileText size={13} />
            <span>Action Plan</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeTab === "chat"
                ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <MessageSquare size={13} />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* ── Tab Content: Ask AI (Chat Interface) ───────────────────────── */}
      {activeTab === "chat" && <ChatInterface />}

      {/* ── Tab Content: Action Plan ───────────────────────────────────── */}
      {activeTab === "plan" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

            {/* State 1: No entity selected */}
            {!selectedEntity && (
              <div className="flex flex-col items-center justify-center h-52 text-center gap-3 mt-6">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                  <PackageSearch size={26} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">No Incident Selected</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                    Click an SOS incident marker on the map to begin AI analysis.
                  </p>
                </div>
              </div>
            )}

            {/* State 2: Non-SOS entity selected */}
            {selectedEntity && !isActionableIncident && (
              <div className="flex flex-col items-center justify-center gap-3 mt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
                  <TriangleAlert size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedEntity.symbol?.replace(/_/g, " ") || "Entity"} selected
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[210px] leading-relaxed">
                    Select an <span className="text-amber-700 font-semibold">active SOS incident</span> on the map to generate a response plan.
                  </p>
                </div>
                <span className="text-[10px] text-slate-600 font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                  {selectedEntity.entity_type?.replace(/_/g, " ")}
                </span>
              </div>
            )}

            {/* State 3: SOS entity selected */}
            {selectedEntity && isActionableIncident && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Incident</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider font-bold">
                    SOS
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 capitalize truncate">
                      {selectedEntity.symbol?.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      ID: {formatId(selectedEntity.id)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize border ${
                      selectedEntity.status === "critical"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : selectedEntity.status === "active"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {selectedEntity.status}
                  </span>
                </div>

                {/* Action Buttons */}
                {!isDecisionFinalized && (
                  <div className="space-y-2 pt-0.5">
                    <button
                      onClick={handleRequestPlan}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold
                                 bg-slate-900 hover:bg-slate-800 text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-wait
                                 shadow-sm"
                    >
                      {loading ? (
                        <><Loader2 size={14} className="animate-spin" /> AI Analyzing Incident…</>
                      ) : snapshot ? (
                        <><RefreshCw size={13} /> Re-run AI Analysis</>
                      ) : (
                        <><Brain size={13} /> Request AI Recommendation</>
                      )}
                    </button>

                    <button
                      onClick={handleSimulateDemoPlan}
                      disabled={loading}
                      title="Instantly simulates a valid AI directive for end-to-end UI testing"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold
                                 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300
                                 transition-all duration-150 disabled:opacity-50"
                    >
                      <Sparkles size={12} className="text-slate-600" />
                      Simulate AI (Demo Mode)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50">
                <TriangleAlert size={15} className="text-rose-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-800">Pipeline Error</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-snug break-words">{error}</p>
                  <div className="mt-2 pt-1.5 border-t border-rose-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">Want to test approval flow?</span>
                    <button
                      onClick={handleSimulateDemoPlan}
                      className="text-[11px] text-slate-900 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sparkles size={10} />
                      Run Demo Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Snapshot Status Row */}
            {snapshot && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Snapshot Status</span>
                  {snapshot.is_demo && (
                    <span className="text-[9px] px-1.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold uppercase">
                      Demo
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    snapshot.status === "validated"  ? "text-slate-900 bg-slate-100 border-slate-300" :
                    snapshot.status === "approved"   ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                    snapshot.status === "rejected"   ? "text-rose-700 bg-rose-50 border-rose-200" :
                    snapshot.status === "stale"      ? "text-amber-700 bg-amber-50 border-amber-200" :
                                                       "text-slate-700 bg-slate-100 border-slate-200"
                  }`}
                >
                  {snapshot.status}
                </span>
              </div>
            )}

            {/* Collapsible Validation Section */}
            {snapshot && validationResult && (
              <ValidationSection validationResult={validationResult} />
            )}

            {/* AI Plan Display */}
            {aiPlan && <AiPlanDisplay aiPlan={aiPlan} />}

            {/* Action Result Banner */}
            {actionResult && (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                  actionResult.type === "success" ? "border-emerald-200 bg-emerald-50" :
                  actionResult.type === "stale"   ? "border-amber-200 bg-amber-50" :
                                                    "border-rose-200 bg-rose-50"
                }`}
              >
                {actionResult.type === "success" ? (
                  <ShieldCheck size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                ) : actionResult.type === "stale" ? (
                  <TriangleAlert size={15} className="text-amber-600 mt-0.5 shrink-0" />
                ) : (
                  <ShieldX size={15} className="text-rose-600 mt-0.5 shrink-0" />
                )}
                <p className={`text-xs leading-snug font-semibold ${
                  actionResult.type === "success" ? "text-emerald-800" :
                  actionResult.type === "stale"   ? "text-amber-800" : "text-rose-800"
                }`}>
                  {actionResult.message}
                </p>
              </div>
            )}

            {/* Reject Prompt */}
            {rejectPromptOpen && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 space-y-2.5">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">State Rejection Reason</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Resource quantities don't match field conditions..."
                  rows={3}
                  className="w-full bg-white border border-rose-300 rounded-lg p-2.5 text-xs text-slate-900
                             placeholder-slate-400 resize-none focus:outline-none focus:border-rose-500 focus:ring-1
                             focus:ring-rose-500 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || loadingAction === "reject"}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold
                               bg-rose-600 hover:bg-rose-700 text-white
                               transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loadingAction === "reject" ? <Loader2 size={13} className="animate-spin" /> : <ShieldX size={13} />}
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => { setRejectPromptOpen(false); setRejectReason(""); }}
                    className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Approval Footer */}
          {snapshot && !isDecisionFinalized && !rejectPromptOpen && (
            <div className="shrink-0 px-4 pb-4 pt-3 border-t border-slate-200 bg-white space-y-2 shadow-sm">
              {isPlanValid ? (
                <>
                  <p className="text-[10px] text-center text-slate-500 font-medium">
                    All validation checks passed. Plan ready for officer review.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={loadingAction === "approve"}
                      id="btn-approve-plan"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold
                                 bg-emerald-600 hover:bg-emerald-700 text-white
                                 transition-all disabled:opacity-50 disabled:cursor-wait shadow-sm"
                    >
                      {loadingAction === "approve" ? <Loader2 size={15} className="animate-spin" /> : <ThumbsUp size={15} />}
                      Approve Plan
                    </button>
                    <button
                      onClick={() => setRejectPromptOpen(true)}
                      id="btn-reject-plan"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold
                                 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200
                                 transition-all shadow-sm"
                    >
                      <ThumbsDown size={15} />
                      Reject Plan
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-center text-rose-600 font-semibold">
                    {validationErrors.length > 0
                      ? `${validationErrors.length} validation failure(s). Approval is blocked.`
                      : "Plan unverified. Approval is blocked."}
                  </p>
                  <div className="flex gap-2">
                    <button disabled className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                      <ThumbsUp size={15} /> Approve Plan
                    </button>
                    <button
                      onClick={() => setRejectPromptOpen(true)}
                      id="btn-reject-failed-plan"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shadow-sm"
                    >
                      <ThumbsDown size={15} /> Reject Plan
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Finalized State Footer */}
          {isDecisionFinalized && (
            <div className="shrink-0 px-4 pb-4 pt-3 border-t border-slate-200 bg-white shadow-sm">
              <button
                onClick={handleRequestPlan}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold
                           bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} /> Generate New AI Plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
