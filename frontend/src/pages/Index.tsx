import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mic, ArrowUp, Square, Bot, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const callChatOnce = async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/llm/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          msg = body?.detail || body?.error?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.content }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "请求失败，请稍后重试。";
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const callChatStream = async (text: string) => {
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // 先追加用户消息,等待 AI 响应
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch(`/api/llm/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
          if (payload.type === "token" && typeof payload.content === "string") {
            assistant += payload.content;
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === "assistant") {
                // 更新已有的 assistant 消息
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: assistant };
                return next;
              } else {
                // 首次收到 token,添加新的 assistant 消息
                return [...prev, { role: "assistant", content: assistant }];
              }
            });
          } else if (payload.type === "error") {
            throw new Error(payload.message || "流式出错");
          } else if (payload.type === "end") {
            // 结束事件
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "请求失败，请稍后重试。";
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    setQuery("");
    void callChatStream(text);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const hero = (
    <main className="container mx-auto px-4 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="w-full max-w-4xl space-y-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-in slide-in-from-bottom-4 duration-700">
          今天想学点什么?
        </h1>
        <form onSubmit={handleSubmit} className="relative animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="relative flex items-center gap-3 px-6 py-4 rounded-full border bg-card shadow-lg hover:shadow-xl transition-shadow">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
            <Input
              type="text"
              placeholder="询问任何问题,或添加资料开始学习..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0"
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
    </main>
  );

  const chat = (
    <main className="flex-1 flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
            >
              {/* AI 头像在左侧 */}
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 self-start">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              {/* 消息气泡 */}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  m.role === "user"
                    ? "text-white"
                    : "bg-muted"
                }`}
                style={m.role === "user" ? { backgroundColor: 'rgb(104, 82, 211)' } : {}}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  {m.content}
                </div>
              </div>

              {/* 用户头像在右侧 */}
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-start" style={{ background: 'linear-gradient(to bottom right, rgb(104, 82, 211), rgb(88, 64, 191))' }}>
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* 加载状态 - 当最后一条消息是用户消息,或者是空的 assistant 消息时显示 */}
          {loading && messages.length > 0 && (
            messages[messages.length - 1]?.role === "user" ||
            (messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "")
          ) && (
            <div className="flex gap-2 justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 self-start">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="rounded-2xl px-5 py-3 bg-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 悬浮在底部的输入框 */}
      <div className="pb-6 px-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-card border shadow-lg hover:shadow-xl transition-shadow">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
            <Input
              type="text"
              placeholder="继续提问..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {loading ? (
                <Button type="button" size="icon" variant="ghost" onClick={handleStop} className="h-8 w-8">
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" size="icon" className="h-10 w-10 rounded-full">
                  <ArrowUp className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {messages.length === 0 ? hero : chat}
    </div>
  );
};

export default Index;
