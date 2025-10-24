import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mic, ArrowUp, Square, Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const Index = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      // 延迟一点执行,确保动画开始
      setTimeout(() => {
        setQuery("");
        void callChatStream(text);
      }, 100);
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

  // 统一的输入框组件
  const inputForm = (
    <form
      onSubmit={handleSubmit}
      className={`w-full transition-all duration-700 ease-in-out ${
        showChat
          ? "fixed bottom-0 left-0 right-0 animate-in slide-in-from-top-full"
          : "relative"
      }`}
    >
      {showChat && (
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-sm pointer-events-none" />
      )}
      <div className={`mx-auto px-4 ${showChat ? "max-w-3xl pb-6 pt-4 relative z-10" : "max-w-4xl"}`}>
        <div
          className={`flex items-center gap-3 px-6 py-4 rounded-full border bg-card shadow-lg hover:shadow-xl transition-all ${
            showChat ? "border-2 shadow-2xl" : ""
          }`}
        >
          {!showChat && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
          )}
          <Input
            type="text"
            placeholder={showChat ? "继续提问..." : "询问任何问题,或添加资料开始学习..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0"
            autoFocus={!showChat}
          />
          <div className="flex items-center gap-2 shrink-0">
            {!showChat && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <Mic className="w-5 h-5" />
              </Button>
            )}
            {loading ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={handleStop}
                className="h-10 w-10 rounded-full"
              >
                <Square className="w-5 h-5" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                <ArrowUp className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {!showChat ? (
        // 欢迎页
        <main
          className="container mx-auto px-4 flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 80px)" }}
        >
          <div className="w-full max-w-4xl space-y-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">今天想学点什么?</h1>
            {inputForm}
          </div>
        </main>
      ) : (
        // 聊天页
        <main className="flex-1 relative">
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
                        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>
          {inputForm}
        </main>
      )}
    </div>
  );
};

export default Index;
