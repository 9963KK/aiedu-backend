import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mic, ArrowUp } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const callChatOnce = async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/llm/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.content }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "请求失败，请稍后重试。" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    setQuery("");
    void callChatOnce(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 flex items-center justify-center" style={{ minHeight: "calc(100vh - 80px)" }}>
        <div className="w-full max-w-4xl space-y-12 text-center">
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            今天想学点什么？
          </h1>

          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center gap-3 px-6 py-4 rounded-full border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
              
              <Input
                type="text"
                placeholder="询问任何问题，或添加资料开始学习..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0"
              />
              
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  <Mic className="w-5 h-5" />
                </Button>
                
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Messages */}
          <div className="text-left space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className="rounded-lg border p-4 bg-card">
                <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "你" : "AI"}</div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="rounded-lg border p-4 bg-card text-muted-foreground">正在思考...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
