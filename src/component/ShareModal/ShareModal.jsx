import React, { useState } from 'react';
import { FiShare2, FiCopy, FiCheck, FiX, FiExternalLink, FiCode, FiTwitter, FiFacebook } from 'react-icons/fi';
import API from '../../api';
import './ShareModal.scss';

const LANGUAGE_ICONS = {
  'C++': '🔵', Python: '🐍', Java: '☕',
  JavaScript: '🟨', TypeScript: '🔷', 'C#': '💜', PHP: '🐘',
};

const ShareModal = ({ onClose, code, language, roomId, title }) => {
  const [step, setStep] = useState('create');   // create | done | loading | error
  const [shareUrl, setShareUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [customTitle, setCustomTitle] = useState(title || `Code ${new Date().toLocaleDateString('vi-VN')}`);
  const [expiresInHours, setExpiresInHours] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  // ─────────────────────────────────────────────
  // Tạo link share
  // ─────────────────────────────────────────────
  const handleCreate = async () => {
    setStep('loading');
    setError('');
    try {
      const res = await API.post('share', {
        code,
        language,
        title: customTitle,
        roomId,
        expiresInHours: expiresInHours ? parseInt(expiresInHours, 10) : undefined,
      });

      setShareUrl(res.data.shareUrl);
      setEmbedUrl(res.data.embedUrl);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Không thể tạo link share');
      setStep('error');
    }
  };

  // ─────────────────────────────────────────────
  // Copy to clipboard
  // ─────────────────────────────────────────────
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  // ─────────────────────────────────────────────
  // Share lên mạng xã hội
  // ─────────────────────────────────────────────
  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const text = `Xem code của tôi trên CodeRoom: ${customTitle}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  // ─────────────────────────────────────────────
  // Render: Form tạo
  // ─────────────────────────────────────────────
  const renderCreateForm = () => (
    <div className="share-body">
      <div className="share-preview">
        <div className="preview-header">
          <span className="lang-icon">{LANGUAGE_ICONS[language] || '💻'}</span>
          <span className="lang-name">{language}</span>
        </div>
        <div className="preview-code">
          <pre><code>{code.substring(0, 200)}{code.length > 200 ? '...' : ''}</code></pre>
        </div>
      </div>

      <div className="share-form">
        <label className="form-label">
          Tiêu đề
          <input
            type="text"
            className="form-input"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Tên cho code share của bạn..."
            maxLength={200}
          />
        </label>

        <label className="form-label">
          Tự động hết hạn (tuỳ chọn)
          <select
            className="form-input"
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
          >
            <option value="">Vĩnh viễn</option>
            <option value="1">1 giờ</option>
            <option value="24">24 giờ</option>
            <option value="72">3 ngày</option>
            <option value="168">7 ngày</option>
            <option value="720">30 ngày</option>
          </select>
        </label>

        <button className="btn-create" onClick={handleCreate}>
          <FiShare2 size={14} />
          Tạo Link Share
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Render: Thành công + các tuỳ chọn
  // ─────────────────────────────────────────────
  const renderDone = () => (
    <div className="share-body done">
      <div className="success-icon">
        <FiCheck size={32} />
      </div>
      <p className="success-text">Link share đã được tạo!</p>

      {/* Share URL */}
      <div className="link-row">
        <div className="link-label">
          <FiExternalLink size={13} /> Link xem
        </div>
        <div className="link-value-wrap">
          <input className="link-value" readOnly value={shareUrl} onClick={(e) => e.target.select()} />
          <button
            className={`link-copy-btn ${copied === 'share' ? 'copied' : ''}`}
            onClick={() => copyToClipboard(shareUrl, 'share')}
            title="Copy link"
          >
            {copied === 'share' ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </button>
        </div>
      </div>

      {/* Embed URL */}
      <div className="link-row">
        <div className="link-label">
          <FiCode size={13} /> Embed iframe
        </div>
        <div className="link-value-wrap">
          <input
            className="link-value"
            readOnly
            value={`<iframe src="${embedUrl}" width="100%" height="400" style="border:1px solid rgba(99,102,241,0.15);border-radius:8px"></iframe>`}
            onClick={(e) => e.target.select()}
          />
          <button
            className={`link-copy-btn ${copied === 'embed' ? 'copied' : ''}`}
            onClick={() => copyToClipboard(`<iframe src="${embedUrl}" width="100%" height="400" style="border:1px solid rgba(99,102,241,0.15);border-radius:8px"></iframe>`, 'embed')}
            title="Copy embed code"
          >
            {copied === 'embed' ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </button>
        </div>
      </div>

      {/* Social share */}
      <div className="social-row">
        <span className="social-label">Chia sẻ lên:</span>
        <button className="social-btn facebook" onClick={shareToFacebook}>
          <FiFacebook size={16} /> Facebook
        </button>
        <button className="social-btn twitter" onClick={shareToTwitter}>
          <FiTwitter size={16} /> Twitter
        </button>
      </div>

      {/* Preview */}
      <div className="preview-wrapper">
        <div className="preview-card">
          <div className="preview-card-bg"></div>
          <div className="preview-card-content">
            <div className="card-title-preview">{customTitle}</div>
            <div className="card-lang">
              <span className="mini-badge">{LANGUAGE_ICONS[language] || '💻'} {language}</span>
            </div>
            <div className="card-footer-preview">CodeRoom — Real-time Collaborative Coding</div>
          </div>
        </div>
        <p className="preview-hint">Preview khi share lên Facebook / Discord</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Render: Lỗi
  // ─────────────────────────────────────────────
  const renderError = () => (
    <div className="share-body error-state">
      <div className="error-icon">❌</div>
      <p className="error-text">{error}</p>
      <button className="btn-retry" onClick={() => setStep('create')}>
        Thử lại
      </button>
    </div>
  );

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <div className="share-header-icon">
            <FiShare2 size={18} />
          </div>
          <div>
            <h2 className="share-title">Share &amp; Embed</h2>
            <p className="share-subtitle">
              {step === 'create' && 'Tạo link chia sẻ code ra ngoài'}
              {step === 'loading' && 'Đang tạo link...'}
              {step === 'done' && 'Code đã sẵn sàng để chia sẻ!'}
              {step === 'error' && 'Có lỗi xảy ra'}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {step === 'create' && renderCreateForm()}
        {step === 'loading' && (
          <div className="share-body loading-state">
            <div className="spinner"></div>
            <p>Đang tạo link share...</p>
          </div>
        )}
        {step === 'done' && renderDone()}
        {step === 'error' && renderError()}
      </div>
    </div>
  );
};

export default ShareModal;
