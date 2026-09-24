package app

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type MediaStorage interface {
	Put(context.Context, string, []byte) error
	Read(context.Context, string) ([]byte, error)
}
type LocalMediaStorage struct{ Root string }

var mediaIDPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func (m LocalMediaStorage) Put(_ context.Context, id string, data []byte) error {
	if !mediaIDPattern.MatchString(id) {
		return errValidation
	}
	if err := os.MkdirAll(m.Root, 0700); err != nil {
		return err
	}
	f, err := os.CreateTemp(m.Root, "upload-")
	if err != nil {
		return err
	}
	name := f.Name()
	defer os.Remove(name)
	if _, err = f.Write(data); err != nil {
		f.Close()
		return err
	}
	if err = f.Close(); err != nil {
		return err
	}
	return os.Rename(name, filepath.Join(m.Root, id+".jpg"))
}
func (m LocalMediaStorage) Read(_ context.Context, id string) ([]byte, error) {
	if !mediaIDPattern.MatchString(id) {
		return nil, errValidation
	}
	return os.ReadFile(filepath.Join(m.Root, id+".jpg"))
}
func mediaSignature(secret []byte, id, expires string) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte("media-upload-v1:" + id + ":" + expires))
	return hex.EncodeToString(mac.Sum(nil))
}
func normalizeMedia(raw []byte) ([]byte, error) {
	if len(raw) > 2*1024*1024 {
		return nil, errValidation
	}
	config, format, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil || (format != "jpeg" && format != "png") || config.Width < 16 || config.Height < 16 || config.Width > 2048 || config.Height > 2048 || int64(config.Width)*int64(config.Height) > 4*1024*1024 {
		return nil, errValidation
	}
	decoded, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, errValidation
	}
	canvas := image.NewRGBA(decoded.Bounds())
	draw.Draw(canvas, canvas.Bounds(), &image.Uniform{C: color.White}, image.Point{}, draw.Src)
	draw.Draw(canvas, canvas.Bounds(), decoded, decoded.Bounds().Min, draw.Over)
	var out bytes.Buffer
	if err = jpeg.Encode(&out, canvas, &jpeg.Options{Quality: 85}); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}
func (a *App) handleMedia(w http.ResponseWriter, r *http.Request) {
	if a.mediaStorage == nil {
		writeError(w, 503, "media_unavailable", "media_unavailable", "errors.mediaUnavailable", nil)
		return
	}
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/media/"), "/")
	if path == "uploads" && r.Method == http.MethodPost {
		user, ok := a.requireAuth(w, r)
		if !ok {
			return
		}
		if !a.commerceLimiter.Allow("upload:" + user.User.ID) {
			writeError(w, 429, "rate_limited", "rate_limited", "errors.rateLimited", nil)
			return
		}
		var req struct {
			Purpose string `json:"purpose"`
		}
		if !decodeJSON(w, r, &req) {
			return
		}
		if req.Purpose != "creator_avatar" && req.Purpose != "creator_banner" {
			mapError(w, errValidation)
			return
		}
		var id string
		err := a.store.db.QueryRow(r.Context(), `INSERT INTO media_assets(owner_user_id,purpose) SELECT $1,$2 WHERE EXISTS(SELECT 1 FROM creator_profiles WHERE user_id=$1 AND status<>'blocked') AND (SELECT count(*) FROM media_assets WHERE owner_user_id=$1 AND created_at>now()-interval '1 day')<40 RETURNING id`, user.User.ID, req.Purpose).Scan(&id)
		if errors.Is(err, pgx.ErrNoRows) {
			mapError(w, errForbidden)
			return
		}
		if err != nil {
			mapError(w, err)
			return
		}
		expires := strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)
		url := "/api/v1/media/uploads/" + id + "?expires=" + expires + "&signature=" + mediaSignature(a.tokens.secret, id, expires)
		writeJSON(w, 201, map[string]any{"id": id, "upload_url": url, "max_bytes": 2 * 1024 * 1024})
		return
	}
	if strings.HasPrefix(path, "uploads/") && r.Method == http.MethodPut {
		id := strings.TrimPrefix(path, "uploads/")
		expires := r.URL.Query().Get("expires")
		expiry, err := strconv.ParseInt(expires, 10, 64)
		signature, e := hex.DecodeString(r.URL.Query().Get("signature"))
		expected, _ := hex.DecodeString(mediaSignature(a.tokens.secret, id, expires))
		if err != nil || e != nil || !mediaIDPattern.MatchString(id) || expiry < time.Now().Unix() || expiry > time.Now().Add(5*time.Minute).Unix() || !hmac.Equal(signature, expected) {
			mapError(w, errForbidden)
			return
		}
		raw, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 2*1024*1024))
		if err != nil {
			mapError(w, errValidation)
			return
		}
		data, err := normalizeMedia(raw)
		if err != nil {
			mapError(w, err)
			return
		}
		tx, err := a.store.db.Begin(r.Context())
		if err != nil {
			mapError(w, err)
			return
		}
		defer rollbackTx(r.Context(), tx)
		var status string
		err = tx.QueryRow(r.Context(), `SELECT m.status FROM media_assets m JOIN users u ON u.id=m.owner_user_id WHERE m.id=$1 AND u.status='active' AND u.deleted_at IS NULL FOR UPDATE OF m`, id).Scan(&status)
		if err != nil || status != "pending" {
			mapError(w, errConflict)
			return
		}
		if err = a.mediaStorage.Put(r.Context(), id, data); err != nil {
			mapError(w, err)
			return
		}
		_, err = tx.Exec(r.Context(), `UPDATE media_assets SET status='ready' WHERE id=$1`, id)
		if err == nil {
			err = tx.Commit(r.Context())
		}
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, 200, map[string]string{"id": id})
		return
	}
	if mediaIDPattern.MatchString(path) && r.Method == http.MethodGet {
		var owner string
		var public bool
		err := a.store.db.QueryRow(r.Context(), `SELECT m.owner_user_id,EXISTS(SELECT 1 FROM creator_commerce x JOIN creator_profiles c ON c.id=x.creator_profile_id JOIN users u ON u.id=c.user_id WHERE c.status='published' AND u.status='active' AND u.deleted_at IS NULL AND (x.design_json->>'avatar_media_id'=m.id::text OR x.design_json->>'banner_media_id'=m.id::text)) FROM media_assets m WHERE m.id=$1 AND m.status='ready'`, path).Scan(&owner, &public)
		if err != nil {
			mapError(w, errNotFound)
			return
		}
		if !public {
			user, ok := a.requireAuth(w, r)
			if !ok {
				return
			}
			if user.User.ID != owner {
				mapError(w, errForbidden)
				return
			}
		}
		// Каждый запрос повторяет ACL; неизменяемый файл можно не пересылать повторно.
		etag := `"` + path + `"`
		w.Header().Set("Cache-Control", "private, no-cache")
		w.Header().Set("ETag", etag)
		if r.Header.Get("If-None-Match") == etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		data, err := a.mediaStorage.Read(r.Context(), path)
		if err != nil {
			mapError(w, errNotFound)
			return
		}
		w.Header().Set("Content-Type", "image/jpeg")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.WriteHeader(200)
		_, _ = w.Write(data)
		return
	}
	mapError(w, errNotFound)
}
