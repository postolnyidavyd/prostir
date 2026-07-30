import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';

import { App } from './App.tsx';
import store from './store/store.ts';
import './fonts.css';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Кореневий елемент #root не знайдено');
}

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster position="top-right" />
    </Provider>
  </StrictMode>,
);
