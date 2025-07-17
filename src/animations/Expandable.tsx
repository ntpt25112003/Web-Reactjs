import React from 'react';
import { motion, Variants } from 'framer-motion';

interface ExpandableProps {
  show: boolean;
  variants: Variants;
  children: React.ReactNode;
  className?: string;
}

export const Expandable: React.FC<ExpandableProps> = ({
  show,
  variants,
  children,
  className,
}) => (
  <motion.div
    className={className}
    variants={variants}
    animate={show ? 'expanded' : 'collapsed'}
    initial={false}
    style={{ overflow: 'hidden' }}
  >
    {children}
  </motion.div>
);
