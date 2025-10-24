import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mic, ArrowUp, Square, Bot } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const Index = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const callChatStream = async (text: string) => {
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // 添加用户消息 + 助手占位(空内容,用于显示打字动画)
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/llm/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId ?? undefined,
          context: {
            previousMessages: messages.slice(-10),
          },
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          msg = body?.detail || body?.error?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice("data:".length).trim();
          if (!jsonStr) continue;
          let payload: any;
          try {
            payload = JSON.parse(jsonStr);
          } catch {
            continue;
          }
          if (payload.type === "start" && payload.sessionId && !sessionId) {
            setSessionId(payload.sessionId as string);
          } else if (payload.type === "token" && typeof payload.content === "string") {
            let token = payload.content as string;
            if (assistant.length === 0) {
              token = token.replace(/^[\s\r\n]+/, "");
            }
            if (token.length === 0) {
              continue;
            }
            assistant += token;
            // 更新最后一条助手消息内容
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
                next[lastIdx] = { role: "assistant", content: assistant };
              }
              return next;
            });
          } else if (payload.type === "error") {
            throw new Error(payload.message || "流式出错");
          } else if (payload.type === "end") {
            // 结束事件,不做额外处理
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "请求失败,请稍后重试。";
      // 将占位助手消息替换为错误信息
      setMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].role === "assistant" && next[lastIdx].content === "") {
          next[lastIdx] = { role: "assistant", content: message };
          return next;
        }
        return [...next, { role: "assistant", content: message }];
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;

    // 如果是第一条消息,触发过渡动画
    if (messages.length === 0) {
      setIsTransitioning(true);
      // 延迟执行,等待动画完成
      setTimeout(() => {
        setQuery("");
        void callChatStream(text);
      }, 300);
    } else {
      setQuery("");
      void callChatStream(text);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // 判断是否显示聊天界面
  const showChat = messages.length > 0 || isTransitioning;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* 欢迎页 */}
      <main
        className={`container mx-auto px-4 flex items-center justify-center transition-all duration-500 ${
          showChat ? "opacity-0 pointer-events-none absolute inset-0" : "opacity-100 relative"
        }`}
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        <div className="w-full max-w-4xl space-y-12 text-center">
          <h1
            className={`text-4xl md:text-5xl font-bold text-foreground transition-all duration-500 ${
              showChat ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            今天想学点什么?
          </h1>
          <div className="relative">
            <form
              onSubmit={handleSubmit}
              className="relative"
            >
              <div className="flex items-center gap-3 px-6 py-4 rounded-full border bg-card shadow-lg hover:shadow-xl transition-shadow">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Plus className="w-5 h-5" />
                </Button>
                <Input
                  type="text"
                  placeholder="询问任何问题,或添加资料开始学习..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0"
                  autoFocus
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button type="submit" size="icon" className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                    <ArrowUp className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* 聊天页 */}
      {showChat && (
        <main className="flex-1 relative animate-in fade-in duration-300">
          <div className="mx-auto max-w-3xl h-full flex flex-col px-4">
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pb-32">
              {messages.map((m, idx) => {
                const isTyping =
                  loading && idx === messages.length - 1 && m.role === "assistant" && m.content.length === 0;
                const isUser = m.role === "user";

                return (
                  <div
                    key={idx}
                    className={`flex gap-2 animate-in slide-in-from-bottom-2 duration-300 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* AI 头像(仅左侧显示) */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 self-start">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* 消息气泡 */}
                    <div
                      className={`rounded-2xl max-w-[75%] ${
                        isUser
                          ? "bg-[rgb(102,80,210)] text-white px-4 py-2.5"
                          : isTyping
                            ? "px-5 py-3 bg-muted"
                            : "px-4 py-2 bg-card border shadow-sm"
                      }`}
                    >
                      {isTyping ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></span>
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></span>
                        </div>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* 聊天页输入框 */}
          <div className="fixed left-0 right-0 bottom-6 md:bottom-8 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-sm animate-in slide-in-from-bottom duration-500 ease-out">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 pb-2 pt-1">
              <div className="flex items-center gap-3 px-5 py-3 md:px-6 md:py-3 rounded-full border-2 bg-card shadow-2xl hover:shadow-xl transition-shadow">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                  <Plus className="w-5 h-5" />
                </Button>
                <Input
                  type="text"
                  placeholder="继续提问..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8">
                    <Mic className="w-5 h-5" />
                  </Button>
                  {loading ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={handleStop}
                      className="h-9 w-9 md:h-10 md:w-10 rounded-full"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button type="submit" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary hover:bg-primary/90">
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;
