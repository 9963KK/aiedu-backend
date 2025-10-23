import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();

  const courses = [
    { id: 1, name: "数据结构与算法" },
    { id: 2, name: "计算机组成原理" },
    { id: 3, name: "操作系统" },
    { id: 4, name: "计算机网络" },
    { id: 5, name: "数据库系统" },
    { id: 6, name: "软件工程" },
  ];

  return (
    <header className="w-full border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/courses')}
          >
            <BookOpen className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <BookOpen className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card z-50">
              {courses.map((course) => (
                <DropdownMenuItem 
                  key={course.id}
                  className="cursor-pointer"
                  onClick={() => {
                    // 这里可以添加课程跳转逻辑
                    console.log('选择课程:', course.name);
                  }}
                >
                  {course.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
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
