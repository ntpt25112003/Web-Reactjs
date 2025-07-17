// animations.ts
import { Variants, Transition } from 'framer-motion';

const easeOut: Transition['ease'] = [0.25, 0.1, 0.25, 1];
const easeIn: Transition['ease'] = [0.42, 0, 1, 1];

// 👉 Mở rộng / thu gọn form filter
export const expandCollapseFilterVariants: Variants = {
  collapsed: {
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: { duration: 0.55, ease: easeIn } as Transition,
  },
  expanded: {
    height: 'auto',
    marginTop: 12,
    marginBottom: 12,
    opacity: 1,
    overflow: 'hidden',
    transition: { duration: 0.65, ease: easeOut } as Transition,
  },
};

// 👉 Mở rộng / thu gọn row
export const expandCollapseRowVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: { duration: 0.3, ease: easeIn } as Transition,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'hidden',
    transition: { duration: 0.3, ease: easeOut } as Transition,
  },
};

// 👉 Anim khi redirect trang
export const slideInOutVariants: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: { duration: 0.4, ease: easeOut } as Transition,
  },
  exit: {
    x: '-100%',
    transition: { duration: 0.4, ease: easeIn } as Transition,
  },
};

// 👉 Mở rộng ẩn hiện đơn giản (giống animExpand)
export const animExpandVariants: Variants = {
  hide: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: { duration: 0.35, ease: easeIn } as Transition,
  },
  show: {
    height: 'auto',
    opacity: 1,
    overflow: 'hidden',
    transition: { duration: 0.35, ease: easeOut } as Transition,
  },
};
