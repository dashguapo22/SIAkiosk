import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onStartOrder: () => void;
}

export function WelcomeScreen({ onStartOrder }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen gradient-cream flex flex-col items-center justify-center p-8 text-center">
      {/* Logo & Branding */}
      <div className="mb-8 animate-fade-in">
        <div className="w-32 h-32 rounded-full gradient-coffee flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Coffee className="w-16 h-16 text-primary-foreground" />
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-primary mb-4">
          Welcome to<br />
          <span className="text-caramel">Brew & Co.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Handcrafted coffee made with love. Order your perfect drink in just a few taps.
        </p>
      </div>

      {/* Start Order Button */}
      <Button
        onClick={onStartOrder}
        size="lg"
        className="touch-target h-20 px-16 text-2xl font-semibold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 animate-scale-in"
      >
        Start Your Order
      </Button>

      {/* Decorative Elements */}
      <div className="mt-12 flex gap-4 text-muted-foreground text-sm">
        <span>☕ Fresh Roasted</span>
        <span>•</span>
        <span>🌿 Organic Options</span>
        <span>•</span>
        <span>❤️ Made with Love</span>
      </div>
    </div>
  );
}
