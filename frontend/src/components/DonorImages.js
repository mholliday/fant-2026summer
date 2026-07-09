import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Spinner, Alert, Stack } from "react-bootstrap";

// Keep in sync with the backend's per-image limit (donorRoutes.js).
const MAX_MB = 15;
const ACCEPT = "image/png,image/jpeg,image/gif,image/webp";

const fmtSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Image attachments panel for a donor: upload, list (with thumbnails),
 * download, and delete. Thumbnails are fetched as authenticated blobs and
 * shown via object URLs (an <img src> pointing at the API would not carry the
 * auth header). `canEdit` gates upload/delete; download is always available.
 */
const DonorImages = ({ did, api, canEdit }) => {
  const [images, setImages] = useState([]);
  const [urls, setUrls] = useState({}); // imageId -> object URL
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const urlsRef = useRef({}); // mirror of `urls` for cleanup

  const revokeAll = () => {
    Object.values(urlsRef.current).forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = {};
  };

  const loadThumb = async (img) => {
    try {
      const res = await api.donor.getImageBlob(img.imageId);
      const url = URL.createObjectURL(res.data);
      urlsRef.current[img.imageId] = url;
      setUrls((prev) => ({ ...prev, [img.imageId]: url }));
    } catch {
      /* individual thumbnail failure is non-fatal */
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.donor.getImages(did);
      const list = res.data.images ?? [];
      revokeAll();
      setUrls({});
      setImages(list);
      list.forEach(loadThumb);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    return revokeAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [did]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError("");
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(`"${file.name}" exceeds the ${MAX_MB}MB limit`);
          continue;
        }
        await api.donor.uploadImage(did, file);
      }
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (img) => {
    if (!window.confirm(`Delete "${img.filename}"? This cannot be undone.`)) return;
    setError("");
    try {
      await api.donor.deleteImage(img.imageId);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Delete failed");
    }
  };

  const handleDownload = (img) => {
    const url = urls[img.imageId];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = img.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mb-3">
      <h5>Images</h5>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {canEdit && (
        <div className="mb-2 d-flex align-items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading && <Spinner size="sm" animation="border" />}
        </div>
      )}
      {loading ? (
        <Spinner size="sm" animation="border" />
      ) : images.length === 0 ? (
        <p className="text-muted small mb-0">No images attached.</p>
      ) : (
        <div className="d-flex flex-wrap gap-3">
          {images.map((img) => (
            <Card key={img.imageId} style={{ width: 160 }}>
              <div
                style={{
                  height: 120,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8f9fa",
                }}
              >
                {urls[img.imageId] ? (
                  <img
                    src={urls[img.imageId]}
                    alt={img.filename}
                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                  />
                ) : (
                  <Spinner size="sm" animation="border" />
                )}
              </div>
              <Card.Body className="p-2">
                <div className="small text-truncate" title={img.filename}>
                  {img.filename}
                </div>
                <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {fmtSize(img.size)}
                </div>
                <Stack direction="horizontal" gap={1} className="mt-1">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="p-1 flex-fill"
                    style={{ fontSize: "0.7rem" }}
                    onClick={() => handleDownload(img)}
                  >
                    Download
                  </Button>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="p-1"
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => handleDelete(img)}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorImages;
