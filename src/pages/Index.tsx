import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, TabletSmartphone, Monitor } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen gradient-cream flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-24 h-24 rounded-full gradient-coffee flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Coffee className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-display font-bold text-primary mb-2">
          Brew & Co.
        </h1>
        <p className="text-xl text-muted-foreground">
          Coffee Shop Ordering System
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-caramel/10 flex items-center justify-center mb-4">
              <TabletSmartphone className="w-6 h-6 text-caramel" />
            </div>
            <CardTitle className="text-2xl font-display">Customer Kiosk</CardTitle>
            <CardDescription>
              Tablet-based self-ordering system for customers to browse menu and place orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/kiosk">
              <Button className="w-full h-12 text-lg">
                Open Kiosk
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Cashier POS</CardTitle>
            <CardDescription>
              Point-of-sale system for cashiers to manage orders, process payments, and track sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/pos">
              <Button variant="outline" className="w-full h-12 text-lg">
                Open POS
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>☕ Handcrafted with love • Real-time order synchronization</p>
      </div>
    </div>
  );
};

export default Index;
