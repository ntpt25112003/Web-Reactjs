let isEnabled = true;
let isOpen = false;

export const menuController = {
  enable: async (enable: boolean) => {
    isEnabled = enable;
    console.log('Menu enabled:', enable);
  },
  open: async () => {
    if (!isEnabled) return;
    isOpen = true;
    document.body.classList.add('menu-open'); // hoặc logic mở menu
  },
  close: async () => {
    isOpen = false;
    document.body.classList.remove('menu-open'); // hoặc logic đóng menu
  },
  toggle: async () => {
    if (isOpen) await menuController.close();
    else await menuController.open();
  }
};
