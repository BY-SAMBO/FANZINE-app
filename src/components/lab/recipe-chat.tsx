"use client";

import { TextStreamChatTransport, DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface RecipeChatProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  slug: string;
}

type ChatMode = "consultar" | "editar";
type ChatSize = "compact" | "large" | "full";

const SIZE_CONFIG: Record<
  ChatSize,
  { width: string; height: string; fontSize: number; inputSize: number }
> = {
  compact: { width: "380px", height: "480px", fontSize: 13, inputSize: 13 },
  large: { width: "520px", height: "640px", fontSize: 15, inputSize: 15 },
  full: {
    width: "calc(100vw - 48px)",
    height: "calc(100vh - 140px)",
    fontSize: 16,
    inputSize: 15,
  },
};

const SIZE_CYCLE: ChatSize[] = ["compact", "large", "full"];

// Tool display names for the UI
const TOOL_LABELS: Record<string, string> = {
  updateRecipeName: "Cambiar nombre",
  updateSubtitle: "Cambiar subtítulo",
  updateIngredientName: "Renombrar ingrediente",
  updateIngredientRole: "Cambiar rol",
  updateMeter: "Ajustar meter",
  updateFlavorProfile: "Cambiar perfil de sabor",
  updateLabNotes: "Editar notas del lab",
  updateIngredientNotes: "Notas de ingrediente",
};

function describeToolInput(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case "updateRecipeName":
      return `→ ${input.newName}`;
    case "updateSubtitle":
      return `→ ${input.newSubtitle}`;
    case "updateIngredientName":
      return `${input.currentName} → ${input.newName}`;
    case "updateIngredientRole":
      return `${input.ingredientName}: ${input.newRole}`;
    case "updateMeter":
      return `${input.meterName}: ${input.value}/5`;
    case "updateFlavorProfile": {
      const t = String(input.newText || "");
      return t.length > 60 ? t.slice(0, 60) + "..." : t;
    }
    case "updateLabNotes": {
      const n = String(input.notes || "");
      return n.length > 60 ? n.slice(0, 60) + "..." : n;
    }
    case "updateIngredientNotes":
      return `${input.ingredientName}: ${input.notes}`;
    default:
      return JSON.stringify(input);
  }
}

export function RecipeChat({ iframeRef, slug }: RecipeChatProps) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<string>("");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("consultar");
  const [size, setSize] = useState<ChatSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lab-chat-size") as ChatSize) || "compact";
    }
    return "compact";
  });
  // Track which tool calls have been applied
  const [appliedTools, setAppliedTools] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  // Request context from iframe
  const requestContext = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "get-recipe-context" }, "*");
    }
  }, [iframeRef]);

  // Listen for context response and edit confirmations from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "recipe-context") {
        setContext(e.data.context);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Request context when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    function onLoad() {
      requestContext();
    }
    iframe.addEventListener("load", onLoad);
    requestContext();
    return () => iframe.removeEventListener("load", onLoad);
  }, [iframeRef, requestContext]);

  // Transport for "consultar" mode (text stream)
  const [consultTransport] = useState(
    () =>
      new TextStreamChatTransport({
        api: "/api/lab/chat",
        body: () => ({ recipeContext: contextRef.current, mode: "consultar" }),
      }),
  );

  // Transport for "editar" mode (data stream — supports tool calls)
  const [editTransport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/lab/chat",
        body: () => ({ recipeContext: contextRef.current, mode: "editar" }),
      }),
  );

  const consultChat = useChat({ transport: consultTransport, id: "consult" });
  const editChat = useChat({ transport: editTransport, id: "edit" });

  const activeChat = mode === "consultar" ? consultChat : editChat;
  const { messages, sendMessage, status } = activeChat;

  const isStreaming = status === "streaming" || status === "submitted";

  // Persist size preference
  useEffect(() => {
    localStorage.setItem("lab-chat-size", size);
  }, [size]);

  // Auto-apply tool edits when they arrive as output-available from server
  useEffect(() => {
    if (mode !== "editar") return;
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const part of m.parts) {
        const pAny = part as Record<string, unknown>;
        if (!pAny.toolCallId || !pAny.state) continue;
        if (pAny.state === "output-available" && !appliedTools.has(pAny.toolCallId as string)) {
          const toolName =
            (pAny.toolName as string) ||
            (part.type.startsWith("tool-") ? part.type.slice(5) : part.type);
          applyToolEdit(
            pAny.toolCallId as string,
            toolName,
            (pAny.input as Record<string, unknown>) || {},
          );
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, mode]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage({ text });
  }

  function applyToolEdit(toolCallId: string, toolName: string, toolInput: Record<string, unknown>) {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    // Send edit command to iframe
    iframe.contentWindow.postMessage(
      {
        type: "apply-edit",
        tool: toolName,
        args: toolInput,
      },
      "*",
    );

    // Mark as applied
    setAppliedTools((prev) => new Set(prev).add(toolCallId));

    // Refresh context after edit
    setTimeout(() => requestContext(), 300);
  }

  function cycleSize() {
    const idx = SIZE_CYCLE.indexOf(size);
    const next = SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length];
    setSize(next);
  }

  const cfg = SIZE_CONFIG[size];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) requestContext();
        }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          border: "3px solid #000",
          boxShadow: "4px 4px 0 #000",
          backgroundColor: open ? "#000" : "#e63946",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          transition: "background-color 150ms",
        }}
        title="Chat Lab"
      >
        {open ? "\u2715" : "\u2728"}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: cfg.width,
            maxWidth: "calc(100vw - 48px)",
            height: cfg.height,
            maxHeight: "calc(100vh - 140px)",
            border: "3px solid #000",
            boxShadow: "6px 6px 0 #000",
            backgroundColor: "#fff",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Space Grotesk', sans-serif",
            transition: "width 200ms, height 200ms",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "3px solid #000",
              backgroundColor: "#e63946",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Lab &mdash; {slug}
            </span>
            <button
              onClick={cycleSize}
              style={{
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.5)",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
                padding: "2px 6px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                lineHeight: 1,
              }}
              title={`Tamaño: ${size}`}
            >
              {size === "compact" ? "S" : size === "large" ? "M" : "L"}
            </button>
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", borderBottom: "3px solid #000" }}>
            <button
              onClick={() => setMode("consultar")}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderRight: "2px solid #000",
                backgroundColor: mode === "consultar" ? "#fff" : "#f5f5f5",
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: mode === "consultar" ? "#000" : "#999",
                position: "relative",
              }}
            >
              <span style={{ marginRight: 6 }}>💬</span>
              Consultar
              {mode === "consultar" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: "#e63946",
                  }}
                />
              )}
            </button>
            <button
              onClick={() => {
                setMode("editar");
                requestContext();
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                backgroundColor: mode === "editar" ? "#fff" : "#f5f5f5",
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: mode === "editar" ? "#000" : "#999",
                position: "relative",
              }}
            >
              <span style={{ marginRight: 6 }}>✏️</span>
              Editar receta
              {mode === "editar" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: "#f59e0b",
                  }}
                />
              )}
            </button>
          </div>

          {/* Context indicator */}
          {context && (
            <div
              style={{
                padding: "4px 12px",
                borderBottom: "2px solid #000",
                backgroundColor: mode === "editar" ? "#fffbeb" : "#f9f9f9",
                fontSize: 10,
                color: "#666",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {mode === "editar"
                ? "Modo edición — los cambios se aplican en la receta"
                : `Contexto cargado: ${context.length} chars`}
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontSize: cfg.fontSize,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#999",
                  fontSize: cfg.fontSize,
                  marginTop: 40,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {mode === "consultar" ? "🔬" : "✏️"}
                </div>
                {mode === "consultar" ? (
                  <>
                    <p>Pregunta lo que quieras sobre esta receta.</p>
                    <p style={{ fontSize: cfg.fontSize - 2, marginTop: 8 }}>
                      Sugerencias, ajustes, naming, técnicas...
                    </p>
                  </>
                ) : (
                  <>
                    <p>Pide cambios y se aplican directo en la receta.</p>
                    <p
                      style={{
                        fontSize: cfg.fontSize - 2,
                        marginTop: 8,
                        color: "#b45309",
                      }}
                    >
                      Ej: &ldquo;Cambia el nombre a Birria Fusión&rdquo;,
                      &ldquo;Sube el picante a 4/5&rdquo;
                    </p>
                  </>
                )}
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === "user";

              // Collect text parts and tool parts
              const textParts: string[] = [];
              const toolParts: Array<{
                toolCallId: string;
                toolName: string;
                state: string;
                input?: Record<string, unknown>;
              }> = [];

              for (const part of m.parts) {
                if (part.type === "text" && part.text) {
                  textParts.push(part.text);
                }
                // Tool parts from edit mode: type is "tool-{toolName}" or "dynamic-tool"
                const pAny = part as Record<string, unknown>;
                if (pAny.toolCallId && pAny.state) {
                  const toolName =
                    (pAny.toolName as string) ||
                    (part.type.startsWith("tool-")
                      ? part.type.slice(5)
                      : part.type);
                  toolParts.push({
                    toolCallId: pAny.toolCallId as string,
                    toolName,
                    state: pAny.state as string,
                    input: (pAny.input as Record<string, unknown>) || undefined,
                  });
                }
              }

              const text = textParts.join("");
              const hasContent = text || toolParts.length > 0;
              if (!hasContent) return null;

              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {/* Text content */}
                  {text && (
                    <div
                      style={{
                        padding: "10px 14px",
                        border: `2px solid ${
                          !isUser && mode === "editar" ? "#f59e0b" : "#000"
                        }`,
                        backgroundColor: isUser
                          ? "#000"
                          : mode === "editar"
                            ? "#fffbeb"
                            : "#fff",
                        color: isUser ? "#fff" : "#000",
                        fontSize: cfg.fontSize,
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                      }}
                    >
                      {isUser ? (
                        <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
                      ) : (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p style={{ margin: "0.4em 0" }}>{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong style={{ fontWeight: 700 }}>
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em style={{ fontStyle: "italic" }}>
                                {children}
                              </em>
                            ),
                            ul: ({ children }) => (
                              <ul
                                style={{
                                  margin: "0.4em 0",
                                  paddingLeft: "1.2em",
                                }}
                              >
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol
                                style={{
                                  margin: "0.4em 0",
                                  paddingLeft: "1.2em",
                                }}
                              >
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li style={{ margin: "0.2em 0" }}>
                                {children}
                              </li>
                            ),
                            h1: ({ children }) => (
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "1.1em",
                                  margin: "0.6em 0 0.3em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {children}
                              </div>
                            ),
                            h2: ({ children }) => (
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "1.05em",
                                  margin: "0.5em 0 0.3em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {children}
                              </div>
                            ),
                            h3: ({ children }) => (
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "1em",
                                  margin: "0.4em 0 0.2em",
                                }}
                              >
                                {children}
                              </div>
                            ),
                            code: ({ children }) => (
                              <code
                                style={{
                                  background: "#f0f0f0",
                                  padding: "1px 4px",
                                  fontSize: "0.9em",
                                  border: "1px solid #ddd",
                                }}
                              >
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre
                                style={{
                                  background: "#f0f0f0",
                                  padding: "8px 10px",
                                  margin: "0.4em 0",
                                  overflow: "auto",
                                  border: "2px solid #000",
                                  fontSize: "0.9em",
                                }}
                              >
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}

                  {/* Tool invocation cards */}
                  {toolParts.map((tp) => {
                    const isApplied = appliedTools.has(tp.toolCallId);
                    const isRunning = tp.state === "input-streaming" || tp.state === "input-available";

                    return (
                      <div
                        key={tp.toolCallId}
                        style={{
                          border: `2px solid ${isApplied ? "#22c55e" : "#f59e0b"}`,
                          backgroundColor: isApplied ? "#f0fdf4" : "#fffbeb",
                          padding: "8px 12px",
                          fontSize: cfg.fontSize - 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: tp.input ? 4 : 0,
                          }}
                        >
                          <span style={{ fontSize: cfg.fontSize - 2 }}>
                            {isApplied ? "✅" : isRunning ? "⏳" : "🔧"}
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: cfg.fontSize - 2,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {TOOL_LABELS[tp.toolName] || tp.toolName}
                          </span>
                          {isApplied && (
                            <span
                              style={{
                                color: "#22c55e",
                                fontWeight: 700,
                                fontSize: cfg.fontSize - 2,
                                textTransform: "uppercase",
                                marginLeft: "auto",
                              }}
                            >
                              Aplicado
                            </span>
                          )}
                        </div>

                        {tp.input && (
                          <div
                            style={{
                              color: "#555",
                              fontSize: cfg.fontSize - 2,
                            }}
                          >
                            {describeToolInput(tp.toolName, tp.input)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Role label */}
                  <div
                    style={{
                      fontSize: 9,
                      color: "#999",
                      marginTop: 0,
                      textAlign: isUser ? "right" : "left",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {isUser
                      ? "Tú"
                      : mode === "editar"
                        ? "Lab Editor"
                        : "Lab AI"}
                  </div>
                </div>
              );
            })}

            {isStreaming &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div
                  style={{
                    fontSize: cfg.fontSize - 1,
                    color: "#999",
                    fontStyle: "italic",
                  }}
                >
                  {mode === "editar" ? "Analizando receta..." : "Pensando..."}
                </div>
              )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              borderTop: "3px solid #000",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "editar"
                  ? "Describe el cambio..."
                  : "Escribe aquí..."
              }
              style={{
                flex: 1,
                padding: "12px 14px",
                border: "none",
                outline: "none",
                fontSize: cfg.inputSize,
                fontFamily: "'Space Grotesk', sans-serif",
                backgroundColor: mode === "editar" ? "#fffbeb" : "#fff",
                color: "#000",
              }}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              style={{
                padding: "12px 18px",
                border: "none",
                borderLeft: "3px solid #000",
                backgroundColor:
                  isStreaming || !input.trim()
                    ? "#ccc"
                    : mode === "editar"
                      ? "#f59e0b"
                      : "#e63946",
                color: "#fff",
                fontWeight: 700,
                fontSize: cfg.inputSize,
                cursor:
                  isStreaming || !input.trim() ? "not-allowed" : "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: "uppercase",
              }}
            >
              {mode === "editar" ? "Enviar" : "\u2192"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
