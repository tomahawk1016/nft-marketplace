import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CustomToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
}

const CustomToggle: React.FC<CustomToggleProps> = ({ enabled, onChange, label }) => {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{label}</span>}
      
      <div 
        onClick={() => onChange(!enabled)}
        className={cn(
          "h-8 w-14 rounded-full relative cursor-pointer p-1 transition-colors duration-300",
          enabled ? "bg-primary" : "bg-primary/10"
        )}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "h-6 w-6 rounded-full shadow-sm",
            enabled ? "bg-white" : "bg-primary"
          )}
        />
      </div>
    </div>
  );
};

export default CustomToggle;