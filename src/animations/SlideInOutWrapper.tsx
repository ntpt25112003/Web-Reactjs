import { motion } from 'framer-motion';
import { slideInOutVariants } from './animations';
import React from 'react';

export const SlideInOutWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={slideInOutVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ position: 'absolute', width: '100%' }}
  >
    {children}
  </motion.div>
);
