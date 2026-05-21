import { useState, useEffect } from 'react';

export default function LogoUpload({ onChange, value }) {
  const [preview, setPreview] = useState(value || null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="logo-upload">
      {preview ? (
        <div className="logo-preview">
          <img src={preview} alt="Invoice logo" />
          <button type="button" onClick={() => { setPreview(null); onChange(null); }}>
            Remove
          </button>
        </div>
      ) : (
        <label className="logo-placeholder">
          + Add Your Logo
          <input type="file" accept="image/*" onChange={handleFile} hidden />
        </label>
      )}
    </div>
  );
}
