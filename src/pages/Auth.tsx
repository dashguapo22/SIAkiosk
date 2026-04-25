import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema
  .extend({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function AuthPage() {
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  if (!authLoading && user) {
    return <Navigate to="/pos" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(loginForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected sign in error';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(signupForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! Please wait for admin approval to access the system.');
      setActiveTab('login');
      setSignupForm({ email: '', password: '', confirmPassword: '', fullName: '' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-coffee">
            <Coffee className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Cafe Maestro POS</CardTitle>
          <CardDescription>Sign in to access the cashier dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="cashier@cafemaestro.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="********"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="cashier@cafemaestro.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="********"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="********"
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
