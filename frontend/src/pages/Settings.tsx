import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Save, Crown, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "";
    const savedEmail = localStorage.getItem("userEmail") || "";
    const savedPhone = localStorage.getItem("userPhone") || "";
    
    setUserName(savedName);
    setUserEmail(savedEmail);
    setUserPhone(savedPhone);
  }, []);

  const handleSave = () => {
    localStorage.setItem("userName", userName);
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("userPhone", userPhone);

    toast({
      title: "保存成功",
      description: "您的个人信息已更新",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mr-4 hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">设置</h1>
            <p className="text-sm text-muted-foreground">管理您的账户设置</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl py-8 px-4 sm:px-6">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-2">
              <Crown className="h-4 w-4" />
              会员计划
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              其他设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">个人信息</h2>
              <p className="text-muted-foreground mt-1">
                更新您的个人资料和联系方式
              </p>
            </div>

            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  用户资料
                </CardTitle>
                <CardDescription>
                  这些信息将用于识别您的账户
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      姓名
                    </Label>
                    <Input
                      id="name"
                      placeholder="请输入您的姓名"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      手机号
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="请输入手机号"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    邮箱地址
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入您的邮箱"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    我们会向此邮箱发送重要通知
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="sm:w-auto"
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="sm:w-auto gap-2"
                  >
                    <Save className="h-4 w-4" />
                    保存更改
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">会员计划</h2>
              <p className="text-muted-foreground mt-1">
                管理您的会员订阅和权益
              </p>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  当前计划
                </CardTitle>
                <CardDescription>
                  您的会员状态和可用功能
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-6 text-center">
                  <p className="text-muted-foreground">会员功能即将上线</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="other" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">其他设置</h2>
              <p className="text-muted-foreground mt-1">
                管理其他偏好设置
              </p>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  偏好设置
                </CardTitle>
                <CardDescription>
                  自定义您的使用体验
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-6 text-center">
                  <p className="text-muted-foreground">更多设置即将推出</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
