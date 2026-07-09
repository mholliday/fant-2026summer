import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Spinner, Alert, Stack, Form } from "react-bootstrap";

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
 * Manages a donor's image list + thumbnails as shared state so the panel can
 * be rendered in more than one place (e.g. above the tabs AND inside the
 * Skeletal Inventory tab) and stay in sync. Thumbnails are fetched as
 * authenticated blobs and shown via object URLs (an <img src> pointing at the
 * API would not carry the auth header).
 */
export const useDonorImages = (did, api) => {
  const [images, setImages] = useState([]);
  const [urls, setUrls] = useState({}); // imageId -> object URL
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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
    const input = e.target; // reset via the target so panels need no shared ref
    const files = Array.from(input.files || []);
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
      if (input) input.value = "";
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

  // Update just the caption without re-fetching thumbnails.
  const handleUpdateCaption = async (imageId, caption) => {
    setError("");
    try {
      await api.donor.updateImageCaption(imageId, caption);
      setImages((prev) =>
        prev.map((i) => (i.imageId === imageId ? { ...i, caption } : i))
      );
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to update caption");
    }
  };

  return {
    images,
    urls,
    loading,
    uploading,
    error,
    setError,
    handleUpload,
    handleDelete,
    handleDownload,
    handleUpdateCaption,
  };
};

/**
 * Presentational images panel. Takes shared state via props (from
 * useDonorImages) so multiple instances render the same list in sync.
 */
export const DonorImagesPanel = ({
  canEdit,
  heading = "Images",
  images,
  urls,
  loading,
  uploading,
  error,
  setError,
  handleUpload,
  handleDelete,
  handleDownload,
  handleUpdateCaption,
}) => {
  // Which card's caption is being edited (local to this panel instance) + draft.
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const startEdit = (img) => {
    setEditingId(img.imageId);
    setDraft(img.caption ?? "");
  };
  const saveEdit = async (img) => {
    await handleUpdateCaption(img.imageId, draft.trim());
    setEditingId(null);
  };

  return (
  <div className="mb-3">
    <h5>{heading}</h5>
    {error && (
      <Alert variant="danger" dismissible onClose={() => setError("")}>
        {error}
      </Alert>
    )}
    {canEdit && (
      <div className="mb-2 d-flex align-items-center gap-2">
        <input
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
          <Card key={img.imageId} style={{ width: 180 }}>
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
              {editingId === img.imageId ? (
                <div className="mt-1">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Caption / description"
                    style={{ fontSize: "0.72rem" }}
                  />
                  <Stack direction="horizontal" gap={1} className="mt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      className="p-1 flex-fill"
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => saveEdit(img)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="p-1"
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </div>
              ) : (
                <div className="mt-1">
                  {img.caption ? (
                    <div style={{ fontSize: "0.72rem", whiteSpace: "pre-wrap" }}>{img.caption}</div>
                  ) : (
                    <div className="text-muted fst-italic" style={{ fontSize: "0.7rem" }}>
                      No caption
                    </div>
                  )}
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="link"
                      className="p-0"
                      style={{ fontSize: "0.7rem" }}
                      onClick={() => startEdit(img)}
                    >
                      {img.caption ? "Edit caption" : "Add caption"}
                    </Button>
                  )}
                </div>
              )}
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

/**
 * Convenience wrapper: owns its own state and renders a single panel.
 */
const DonorImages = ({ did, api, canEdit, heading }) => {
  const state = useDonorImages(did, api);
  return <DonorImagesPanel canEdit={canEdit} heading={heading} {...state} />;
};

export default DonorImages;
