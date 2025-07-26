import { useEffect } from 'react';
import { env } from '@/config/env';

export const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    const baseTitle = env.VITE_COMPANY_NAME;
    const fullTitle = title ? `${title} - ${baseTitle}` : baseTitle;
    document.title = fullTitle;
  }, [title]);
}; 
