
import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Box, 
  Image, 
  Server, 
  Settings, 
  FileText, 
  LogOut, 
  Menu, 
  User, 
  ChevronDown,
  Beaker
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Containers', href: '/containers', icon: <Box className="h-5 w-5" /> },
    { name: 'Images', href: '/images', icon: <Image className="h-5 w-5" /> },
    { name: 'QEMU VMs', href: '/vms', icon: <Server className="h-5 w-5" /> },
    { name: 'Test', href: '/test', icon: <Beaker className="h-5 w-5" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
    { name: 'Logs', href: '/logs', icon: <FileText className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`bg-sidebar transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
            {sidebarOpen && (
              <h1 className="text-lg font-semibold text-sidebar-foreground truncate">
                Virtual Dock Control
              </h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`w-full justify-start px-4 py-2 ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <span className="flex items-center">
                    {item.icon}
                    {sidebarOpen && <span className="ml-3">{item.name}</span>}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-sidebar-border">
            {sidebarOpen ? (
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-sidebar-foreground">{user?.username}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="px-0 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      >
                        {user?.role} <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-sidebar-foreground hover:bg-sidebar-accent w-full"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">
            {navItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
