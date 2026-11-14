import { createContext } from 'svelte';
import type { App } from './composition.ts';

/**
 * The app, handed down the component tree. The root layout provides it once,
 * and a route reads it to give its screen what that screen needs. Screens
 * themselves take props, so `src/routes` is the only reader.
 */
export const [useApp, provideApp] = createContext<App>();
