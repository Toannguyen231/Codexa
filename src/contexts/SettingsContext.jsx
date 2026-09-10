/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'codexa-settings';

const DEFAULT_SETTINGS = {
  // ── Code Editor Preferences ──
  defaultLanguage: 'cpp',
  editorFontSize: 14,
  tabSize: 4,
  keybinding: 'standard',

  // ── Sound & Interactive ──
  soundChat: true,
  soundBattle: true,
  soundEffects: true,

  // ── Privacy & Connections ──
  invisibleMode: false,
  showHeatmap: true,
  allowBattleInvites: true,

  // ── Localization ──
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore quota errors */ }
}

const SettingsContext = createContext(undefined);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(loadSettings);

  const updateSetting = useCallback((key, value) => {
    setSettingsState(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      window.dispatchEvent(new CustomEvent('codexa-settings-changed', { detail: { key, value } }));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export { DEFAULT_SETTINGS };
export default SettingsContext;
