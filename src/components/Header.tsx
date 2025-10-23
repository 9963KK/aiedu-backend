import * as React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Settings, ChevronDown, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isHomePage = location.pathname === '/';
  const [selectedCourse, setSelectedCourse] = React.useState("选择课程");
  const [confirmedCourse, setConfirmedCourse] = React.useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [aiText, setAiText] = React.useState("");
  const [isIdentifying, setIsIdentifying] = React.useState(false);

  const courses = [
    { id: 1, name: "数据结构与算法" },
    { id: 2, name: "计算机组成原理" },
    { id: 3, name: "操作系统" },
    { id: 4, name: "计算机网络" },
    { id: 5, name: "数据库系统" },
    { id: 6, name: "软件工程" },
  ];

  const handleConfirmCourse = () => {
    if (selectedCourse !== "选择课程") {
      setConfirmedCourse(selectedCourse);
      toast({
        title: "课程已确认",
        description: `当前学习课程：${selectedCourse}`,
      });
    }
  };

  const handleAiIdentify = async () => {
    if (!aiText.trim()) {
      toast({
        title: "请输入文本",
        description: "请输入课程相关的信息以便AI识别",
        variant: "destructive",
      });
      return;
    }

    setIsIdentifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('identify-course', {
        body: { text: aiText }
      });

      if (error) throw error;

      if (data.course === "未识别") {
        toast({
          title: "无法识别课程",
          description: "请尝试输入更具体的课程相关信息",
          variant: "destructive",
        });
      } else {
        setSelectedCourse(data.course);
        setConfirmedCourse(data.course);
        setAiDialogOpen(false);
        setAiText("");
        toast({
          title: "AI识别成功",
          description: `已识别并选择课程：${data.course}（置信度：${data.confidence === 'high' ? '高' : data.confidence === 'medium' ? '中' : '低'}）`,
        });
      }
    } catch (error) {
      console.error('AI识别错误:', error);
      toast({
        title: "识别失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <header className="w-full border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isHomePage ? (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                {confirmedCourse || selectedCourse}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card z-50">
              {courses.map((course) => (
                <DropdownMenuItem 
                  key={course.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCourse(course.name);
                  }}
                >
                  {course.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedCourse !== "选择课程" && !confirmedCourse && (
            <Button 
              size="sm" 
              onClick={handleConfirmCourse}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              确认
            </Button>
          )}

          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI识别
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>AI自动识别课程</DialogTitle>
                <DialogDescription>
                  输入您想学习的内容描述，AI将自动为您识别并选择对应的课程
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="例如：我想学习如何设计和实现高效的排序算法..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiDialogOpen(false);
                    setAiText("");
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleAiIdentify} disabled={isIdentifying}>
                  {isIdentifying ? "识别中..." : "开始识别"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
