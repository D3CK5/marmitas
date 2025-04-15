import { create } from 'zustand';

interface AuthModalStore {
  isOpen: boolean;
  defaultTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  defaultTab: 'login',
  openAuthModal: (tab = 'login') => set({ isOpen: true, defaultTab: tab }),
  closeAuthModal: () => set({ isOpen: false }),
})); 