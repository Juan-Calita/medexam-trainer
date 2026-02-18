/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AbdominalGame from './pages/AbdominalGame';
import Admin from './pages/Admin';
import AdminAbdominal from './pages/AdminAbdominal';
import AdminCardiacFoci from './pages/AdminCardiacFoci';
import AdminCardiaca from './pages/AdminCardiaca';
import AdminPulmonar from './pages/AdminPulmonar';
import AudioLibrary from './pages/AudioLibrary';
import AudioUpload from './pages/AudioUpload';
import AuscultationCardiaca from './pages/AuscultationCardiaca';
import AuscultationPulmonar from './pages/AuscultationPulmonar';
import CardiacFociGame from './pages/CardiacFociGame';
import Home from './pages/Home';
import ExtraocularGame from './pages/ExtraocularGame';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AbdominalGame": AbdominalGame,
    "Admin": Admin,
    "AdminAbdominal": AdminAbdominal,
    "AdminCardiacFoci": AdminCardiacFoci,
    "AdminCardiaca": AdminCardiaca,
    "AdminPulmonar": AdminPulmonar,
    "AudioLibrary": AudioLibrary,
    "AudioUpload": AudioUpload,
    "AuscultationCardiaca": AuscultationCardiaca,
    "AuscultationPulmonar": AuscultationPulmonar,
    "CardiacFociGame": CardiacFociGame,
    "Home": Home,
    "ExtraocularGame": ExtraocularGame,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};