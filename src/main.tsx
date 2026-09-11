import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { trackPageview } from './lib/analytics.ts';
import './index.css';

trackPageview();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
