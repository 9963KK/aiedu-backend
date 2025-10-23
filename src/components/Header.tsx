import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Brain, BookOpen, ChevronDown, Clock, Settings } from "lucide-react";
import { useState } from "react";

const courses = [
  { id: 1, name: "数据结构与算法" },
  { id: 2, name: "计算机组成原理" },
  { id: 3, name: "操作系统" },
  { id: 4, name: "计算机网络" },
  { id: 5, name: "数据库系统" },
  { id: 6, name: "软件工程" },
];

export function Header() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);

  return (
    <header className="w-full border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI学习助手
              </h1>
              <p className="text-xs text-muted-foreground">智能提效，轻松学习</p>
            </div>
          </div>

          {/* Course Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{selectedCourse.name}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {courses.map((course) => (
                <DropdownMenuItem
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={selectedCourse.id === course.id ? "bg-accent" : ""}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {course.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
