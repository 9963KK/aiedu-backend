import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Settings, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="w-full border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {!isHomePage ? (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/courses')}
          >
            <BookOpen className="w-5 h-5" />
          </Button>
        )}
      </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Clock className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
