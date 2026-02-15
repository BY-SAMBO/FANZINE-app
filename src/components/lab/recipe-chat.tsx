"use client";

import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface RecipeChatProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  slug: string;
}

export function RecipeChat({ iframeRef, slug }: RecipeChatProps) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<string>("");
  const [input, setInput] = useState("");
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

  // Listen for context response from iframe
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
    // Also try immediately in case iframe already loaded
    requestContext();
    return () => iframe.removeEventListener("load", onLoad);
  }, [iframeRef, requestContext]);

  // Use a stable transport with a function body so context is always fresh
  const [transport] = useState(
    () =>
      new TextStreamChatTransport({
        api: "/api/lab/chat",
        body: () => ({ recipeContext: contextRef.current }),
      }),
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";

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

  function getMessageText(m: (typeof messages)[number]): string {
    for (const part of m.parts) {
      if (part.type === "text") return part.text;
    }
    return "";
  }

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
            width: 380,
            maxWidth: "calc(100vw - 48px)",
            height: 480,
            maxHeight: "calc(100vh - 140px)",
            border: "3px solid #000",
            boxShadow: "6px 6px 0 #000",
            backgroundColor: "#fff",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "3px solid #000",
              backgroundColor: "#e63946",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Lab Chat &mdash; {slug}
          </div>

          {/* Context indicator */}
          {context && (
            <div
              style={{
                padding: "6px 16px",
                borderBottom: "2px solid #000",
                backgroundColor: "#f9f9f9",
                fontSize: 10,
                color: "#666",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Contexto cargado: {context.length} chars
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
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#999",
                  fontSize: 13,
                  marginTop: 40,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔬</div>
                <p>Pregunta lo que quieras sobre esta receta.</p>
                <p style={{ fontSize: 11, marginTop: 8 }}>
                  Sugerencias, ajustes, naming, técnicas...
                </p>
              </div>
            )}

            {messages.map((m) => {
              const text = getMessageText(m);
              if (!text) return null;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf:
                      m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      border: "2px solid #000",
                      backgroundColor:
                        m.role === "user" ? "#000" : "#fff",
                      color: m.role === "user" ? "#fff" : "#000",
                      fontSize: 13,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {text}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#999",
                      marginTop: 2,
                      textAlign: m.role === "user" ? "right" : "left",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {m.role === "user" ? "Tú" : "Lab AI"}
                  </div>
                </div>
              );
            })}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
                Pensando...
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
              placeholder="Escribe aquí..."
              style={{
                flex: 1,
                padding: "12px 14px",
                border: "none",
                outline: "none",
                fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif",
                backgroundColor: "#fff",
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
                  isStreaming || !input.trim() ? "#ccc" : "#e63946",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor:
                  isStreaming || !input.trim() ? "not-allowed" : "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: "uppercase",
              }}
            >
              {"\u2192"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
