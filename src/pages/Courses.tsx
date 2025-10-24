import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus, Edit } from "lucide-react";

const courses = [
  { id: 1, name: "数据结构与算法" },
  { id: 2, name: "计算机组成原理" },
  { id: 3, name: "操作系统" },
  { id: 4, name: "计算机网络" },
  { id: 5, name: "数据库系统" },
  { id: 6, name: "软件工程" },
];

const Courses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">我的课程</h1>
              <p className="text-muted-foreground mt-1">管理和查看你的学习课程</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              添加课程
            </Button>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card 
                key={course.id}
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-primary"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground text-center">{course.name}</h3>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Edit className="w-4 h-4" />
                      编辑
                    </Button>
                    <Button className="flex-1">
                      继续学习
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Courses;
