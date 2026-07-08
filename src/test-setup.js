import '@testing-library/jest-dom/vitest';
import appData from '../korean/data/app-data.json';
import { installStaticDataForTests } from './lib/data.js';

Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });

installStaticDataForTests(appData);
