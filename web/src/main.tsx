import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { App } from './App.tsx';
import Toaster from './components/ui/Toaster.tsx';
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
      <Toaster />
    </Provider>
  </StrictMode>,
);
