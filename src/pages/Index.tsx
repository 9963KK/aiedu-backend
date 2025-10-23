import { Header } from "@/components/Header";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { BookOpen, FileEdit, GraduationCap, Sparkles, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "知识点学习",
      description: "AI驱动的可视化学习体验",
      features: [
        "多种材料快速学习知识点",
        "智能生成易于理解的可视化内容",
        "个性化学习路径推荐",
        "实时知识点关联图谱"
      ],
      variant: "primary" as const,
      route: "/learn"
    },
    {
      icon: FileEdit,
      title: "作业辅导",
      description: "智能解答与详细步骤分析",
      features: [
        "AI智能解题与步骤拆解",
        "多种解法对比与分析",
        "错题本智能管理",
        "知识点弱项针对性训练"
      ],
      variant: "accent" as const,
      route: "/homework"
    },
    {
      icon: GraduationCap,
      title: "考试准备",
      description: "模拟考试与真题演练",
      features: [
        "贴合课程考纲的练习题库",
        "智能生成模拟试卷",
        "真题演练与解析",
        "考试技巧与时间管理建议"
      ],
      variant: "success" as const,
      route: "/exam"
    }
  ];

  const stats = [
    { icon: Sparkles, label: "AI辅助学习", value: "24/7" },
    { icon: TrendingUp, label: "平均提分", value: "15%" },
    { icon: Clock, label: "节省时间", value: "40%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            专为理工科大学生设计
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              智能学习，高效提分
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            结合AI技术，为计算机专业学生提供知识学习、作业辅导和考试准备的全方位支持
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" variant="gradient" className="gap-2">
              <Sparkles className="w-5 h-5" />
              立即开始学习
            </Button>
            <Button size="lg" variant="outline">
              了解更多
            </Button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-6 rounded-xl bg-card border shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Features Section */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-3">核心功能</h2>
            <p className="text-muted-foreground">三大模块，全面覆盖你的学习需求</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                features={feature.features}
                variant={feature.variant}
                onExplore={() => navigate(feature.route)}
              />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            加入数千名使用AI学习助手提升成绩的理工科学生
          </p>
          <Button size="lg" variant="gradient" className="gap-2">
            <Sparkles className="w-5 h-5" />
            免费开始使用
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 AI学习助手. 专注于理工科学生的智能学习平台</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
