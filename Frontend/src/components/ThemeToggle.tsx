
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="rounded-full"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-muted-foreground" />
      ) : (
        <Sun className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
