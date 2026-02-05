import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  // Tighter corners (rounded) for enterprise look
  const baseStyles = "inline-flex items-center justify-center rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    // Industrial Orange Primary
    primary: "bg-brand-600 text-white hover:bg-brand-500 shadow-sm shadow-brand-500/20 border border-transparent",
    // Dark grey for secondary actions
    secondary: "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white",
    // Outline for exports/secondary
    outline: "bg-transparent text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-800/30",
    danger: "bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/30 hover:border-red-800/50",
    ghost: "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
  };

  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-xs uppercase font-bold", // More industrial feel
    lg: "px-6 py-2.5 text-sm uppercase font-bold"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};