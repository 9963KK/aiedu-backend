import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mic, ArrowUp } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission logic here
    console.log("Query:", query);
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
        </div>
      </main>
    </div>
  );
};

export default Index;
