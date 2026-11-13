import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { ApiService } from '../../services/api';
import type { CustomerAsset } from '../../types';
import { assetKind, fileSize, humanize } from './format';

interface Props {
  asset: CustomerAsset;
  onClose: () => void;
  onDownload: (asset: CustomerAsset) => void;
}

/**
 * Previews the original uploaded file. The bytes are fetched through the
 * authenticated download endpoint and shown via an object URL, so nothing is
 * substituted when a file is unavailable — the real error is shown instead.
 */
export const AttachmentPreview: React.FC<Props> = ({ asset, onClose, onDownload }) => {
  const kind = assetKind(asset);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let alive = true;
    if (kind === 'doc') return;
    ApiService.downloadAssetBlob(asset.id)
      .then((blob) => {
        if (!alive) return;
        const typed = asset.file_type && blob.type !== asset.file_type ? new Blob([blob], { type: asset.file_type }) : blob;
        objectUrl = URL.createObjectURL(typed);
        setUrl(objectUrl);
      })
      .catch((e) => alive && setError(e?.message || 'The file could not be loaded.'));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset.id, asset.file_type, kind]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ws-modal-backdrop" onClick={onClose}>
      <div className="ws-preview" role="dialog" aria-modal="true" aria-label={`Preview ${asset.file_name}`} onClick={(e) => e.stopPropagation()}>
        <header className="ws-preview-head">
          <div className="ws-preview-title">
            <strong>{asset.file_name}</strong>
            <span>{humanize(asset.asset_category || 'FILE')} · {fileSize(asset)}</span>
          </div>
          {url && (
            <a className="ws-btn ws-btn-sm" href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} /> Open in tab
            </a>
          )}
          <button type="button" className="ws-btn ws-btn-sm ws-btn-primary" onClick={() => onDownload(asset)}>
            <Download size={13} /> Download
          </button>
          <button type="button" className="ws-btn ws-icon-btn ws-btn-sm" onClick={onClose} aria-label="Close preview">
            <X size={15} />
          </button>
        </header>
        <div className="ws-preview-body">
          {error && (
            <div className="ws-preview-msg">
              <AlertCircle size={28} />
              <p>{error}</p>
            </div>
          )}
          {!error && kind !== 'doc' && !url && (
            <div className="ws-preview-msg">
              <Loader2 size={24} className="ws-spin" />
              <p>Loading original file…</p>
            </div>
          )}
          {url && kind === 'image' && <img src={url} alt={asset.file_name} />}
          {url && kind === 'audio' && <audio controls src={url} />}
          {url && kind === 'video' && <video controls src={url} />}
          {url && kind === 'pdf' && <iframe src={url} title={asset.file_name} />}
          {kind === 'doc' && (
            <div className="ws-preview-msg">
              <FileText size={32} />
              <p>This file type can't be previewed in the browser. Download it to open the original.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
