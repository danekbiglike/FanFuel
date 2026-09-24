package app

import (
	"bytes"
	"context"
	"encoding/json"
	"image"
	"image/png"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func testPNG() []byte {
	var raw bytes.Buffer
	_ = png.Encode(&raw, image.NewRGBA(image.Rect(0, 0, 32, 32)))
	return raw.Bytes()
}
func TestNormalizeMedia(t *testing.T) {
	data, err := normalizeMedia(testPNG())
	if err != nil || http.DetectContentType(data) != "image/jpeg" {
		t.Fatal(err)
	}
	for _, raw := range [][]byte{[]byte(`<svg onload="alert(1)"></svg>`), make([]byte, 2*1024*1024+1), []byte("not an image")} {
		if _, err = normalizeMedia(raw); err != errValidation {
			t.Fatal("unsafe image accepted")
		}
	}
}
func TestMediaAccessAndSingleUse(t *testing.T) {
	store := commerceTestStore(t)
	ctx := context.Background()
	a := &App{store: store, tokens: NewTokenService("test-only-secret", time.Hour), commerceLimiter: newRateLimiter(120, time.Minute), mediaStorage: LocalMediaStorage{Root: t.TempDir()}}
	var owner, profile string
	if err := store.db.QueryRow(ctx, `INSERT INTO users(email,password_hash) VALUES('media@example.invalid','test') RETURNING id`).Scan(&owner); err != nil {
		t.Fatal(err)
	}
	if err := store.db.QueryRow(ctx, `INSERT INTO profiles(user_id,display_name,slug) VALUES($1,'Media tester','media-tester') RETURNING id`, owner).Scan(&profile); err != nil {
		t.Fatal(err)
	}
	if _, err := store.db.Exec(ctx, `INSERT INTO creator_profiles(user_id,profile_id,creator_slug,title,status) VALUES($1,$2,'media-tester','Media tester','published')`, owner, profile); err != nil {
		t.Fatal(err)
	}
	token, _, err := a.tokens.CreateAccessToken(CurrentUser{User: User{ID: owner}})
	if err != nil {
		t.Fatal(err)
	}
	call := func(method, url string, body []byte, auth bool) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, url, bytes.NewReader(body))
		if auth {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		w := httptest.NewRecorder()
		a.handleMedia(w, req)
		return w
	}
	w := call("POST", "/api/v1/media/uploads", []byte(`{"purpose":"creator_avatar"}`), true)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var ticket struct {
		ID  string `json:"id"`
		URL string `json:"upload_url"`
	}
	if err = json.Unmarshal(w.Body.Bytes(), &ticket); err != nil {
		t.Fatal(err)
	}
	if w = call("PUT", strings.Replace(ticket.URL, "signature=", "signature=00", 1), testPNG(), false); w.Code != 403 {
		t.Fatal("tampered signature", w.Code)
	}
	if w = call("PUT", ticket.URL, testPNG(), false); w.Code != 200 {
		t.Fatal("upload", w.Code, w.Body.String())
	}
	if w = call("PUT", ticket.URL, testPNG(), false); w.Code != 409 {
		t.Fatal("replay", w.Code)
	}
	if w = call("GET", "/api/v1/media/"+ticket.ID, nil, false); w.Code != 401 {
		t.Fatal("unpublished asset public", w.Code)
	}
	if w = call("GET", "/api/v1/media/"+ticket.ID, nil, true); w.Code != 200 {
		t.Fatal("owner preview", w.Code, w.Body.String())
	}
	config, err := store.CreatorCommerce(ctx, owner, "")
	if err != nil {
		t.Fatal(err)
	}
	config.Design.AvatarMediaID = ticket.ID
	if _, err = store.SaveCreatorCommerce(ctx, owner, *config); err != nil {
		t.Fatal(err)
	}
	if w = call("GET", "/api/v1/media/"+ticket.ID, nil, false); w.Code != 200 || w.Header().Get("Content-Type") != "image/jpeg" {
		t.Fatal("public asset", w.Code)
	}
	config, err = store.CreatorCommerce(ctx, owner, "")
	if err != nil {
		t.Fatal(err)
	}
	config.Design.BannerMediaID = ticket.ID
	if _, err = store.SaveCreatorCommerce(ctx, owner, *config); err != errForbidden {
		t.Fatal("wrong purpose", err)
	}
}
