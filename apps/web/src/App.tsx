import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { LangModal, LANG_KEY } from './components/LangModal';
import i18n from './i18n';

export function App() {
  const [langModalOpen, setLangModalOpen] = useState(!localStorage.getItem(LANG_KEY));

  const handleLangSelect = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
    setLangModalOpen(false);
  };

  return (
    <>
      <LangModal opened={langModalOpen} onSelect={handleLangSelect} />
      <RouterProvider router={router} />
    </>
  );
}
