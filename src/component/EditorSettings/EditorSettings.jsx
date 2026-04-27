import React from 'react';
import './EditorSettings.scss';
import { FiX } from 'react-icons/fi';

const EditorSettings = ({ settings, setSettings, onClose }) => {
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="editor-settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor-settings-modal">
        <div className="settings-header">
          <h3>Editor Settings</h3>
          <button className="btn-close" onClick={onClose}><FiX size={15} /></button>
        </div>
        
        <div className="settings-body">
          <div className="setting-group">
            <label>Theme</label>
            <select 
              value={settings.theme} 
              onChange={e => handleSettingChange('theme', e.target.value)}
            >
              <option value="vs-dark">VS Dark</option>
              <option value="vs-light">VS Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Font Size</label>
            <input 
              type="number" 
              value={settings.fontSize} 
              onChange={e => handleSettingChange('fontSize', parseInt(e.target.value))}
              min="10" 
              max="30" 
            />
          </div>

          <div className="setting-group checkbox">
            <label>Minimap</label>
            <input 
              type="checkbox" 
              checked={settings.minimap} 
              onChange={e => handleSettingChange('minimap', e.target.checked)}
            />
          </div>

          <div className="setting-group checkbox">
            <label>Word Wrap</label>
            <input 
              type="checkbox" 
              checked={settings.wordWrap === 'on'} 
              onChange={e => handleSettingChange('wordWrap', e.target.checked ? 'on' : 'off')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorSettings;
