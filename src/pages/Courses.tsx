import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";

const courses = [
  { id: 1, name: "数据结构与算法", progress: 65, totalLessons: 48, completedLessons: 31 },
  { id: 2, name: "计算机组成原理", progress: 42, totalLessons: 36, completedLessons: 15 },
  { id: 3, name: "操作系统", progress: 78, totalLessons: 40, completedLessons: 31 },
  { id: 4, name: "计算机网络", progress: 30, totalLessons: 45, completedLessons: 14 },
  { id: 5, name: "数据库系统", progress: 55, totalLessons: 38, completedLessons: 21 },
  { id: 6, name: "软件工程", progress: 20, totalLessons: 42, completedLessons: 8 },
];

const Courses = () => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

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
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCourse === course.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCourse(course.id)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{course.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.completedLessons} / {course.totalLessons} 课时
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">学习进度</span>
                      <span className="font-medium text-foreground">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    继续学习
                  </Button>
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
