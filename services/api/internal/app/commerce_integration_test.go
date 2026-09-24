package app

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/fanfuel/fanfuel/services/api/internal/commerce"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Тест создаёт отдельную схему; рабочие таблицы и данные не изменяются.
func commerceTestStore(t *testing.T) *Store {
	t.Helper()
	dsn := os.Getenv("FANFUEL_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("FANFUEL_TEST_DATABASE_URL is not set")
	}
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasSuffix(cfg.ConnConfig.Database, "_test") {
		t.Fatal("test database must end in _test")
	}
	ctx := context.Background()
	admin, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	schema := fmt.Sprintf("commerce_test_%d", time.Now().UnixNano())
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+schema); err != nil {
		t.Fatal(err)
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = schema + ",public"
	cfg.MaxConns = 2
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { pool.Close(); _, _ = admin.Exec(ctx, "DROP SCHEMA "+schema+" CASCADE"); admin.Close() })
	files, err := filepath.Glob("../../../../infra/migrations/*.up.sql")
	if err != nil || len(files) == 0 {
		t.Fatal("migrations missing", err)
	}
	for _, file := range files {
		raw, e := os.ReadFile(file)
		if e != nil {
			t.Fatal(e)
		}
		if _, e = pool.Exec(ctx, string(raw)); e != nil {
			t.Fatalf("%s: %v", file, e)
		}
	}
	// Новую миграцию проверяем также вниз и повторно вверх на пустой схеме.
	for _, migration := range []string{"000011_catalog_directions.down", "000010_commerce_search.down", "000009_creator_media.down", "000008_commerce_foundation.down", "000008_commerce_foundation.up", "000009_creator_media.up", "000010_commerce_search.up", "000011_catalog_directions.up"} {
		raw, e := os.ReadFile("../../../../infra/migrations/" + migration + ".sql")
		if e != nil {
			t.Fatal(e)
		}
		if _, e = pool.Exec(ctx, string(raw)); e != nil {
			t.Fatal(e)
		}
	}
	return NewStore(pool, "", false, NewMockPaymentProvider())
}
func TestCommerceIntegration(t *testing.T) {
	s := commerceTestStore(t)
	ctx := context.Background()
	scalar := func(sql string, args ...any) string {
		t.Helper()
		var id string
		if e := s.db.QueryRow(ctx, sql, args...).Scan(&id); e != nil {
			t.Fatal(e)
		}
		return id
	}
	user := func(name string) string {
		return scalar(`INSERT INTO users(email,password_hash) VALUES($1,'test-only') RETURNING id`, name+"@example.invalid")
	}
	buyer := user("buyer")
	sellerUser := user("seller")
	actor := user("moderator")
	seller := scalar(`INSERT INTO seller_profiles(user_id,display_name,status) VALUES($1,'Test seller','active') RETURNING id`, sellerUser)
	category := scalar(`SELECT id FROM product_categories WHERE slug='design-assets'`)
	p, err := s.CreateSellerProduct(ctx, sellerUser, CreateProductRequest{CategoryID: category, Title: "Sample asset", Description: "An original test asset for development", Terms: "Test delivery within one day", PriceAmountMinor: 999, Currency: "RUB", DeliveryType: "digital_file"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.SubmitSellerProduct(ctx, sellerUser, p.ID); err != errValidation {
		t.Fatal("unconfigured submit", err)
	}
	identity := commerce.Identity{Source: "publisher", ExternalID: "test.example:asset-123", WorkTitle: "Sample asset", Format: "digital_file", Platform: "pc", Edition: "standard", Region: "global", Language: "en", License: "personal", Bundle: "none"}
	input := CommerceProductInput{Identity: identity, PromoBPS: 200, StorefrontBPS: 1000}
	if _, err = s.ConfigureProduct(ctx, buyer, p.ID, input); err != errForbidden {
		t.Fatal("ownership", err)
	}
	p, err = s.ConfigureProduct(ctx, sellerUser, p.ID, input)
	if err != nil || p.VariantKey == "" {
		t.Fatal(p, err)
	}
	if _, err = s.productInsightsFor(ctx, p); err != nil {
		t.Fatal("draft insights", err)
	}
	scalar(`INSERT INTO product_media(product_id,url,visibility,sort_order) VALUES($1,'https://example.invalid/private.jpg','private',0) RETURNING id`, p.ID)
	scalar(`INSERT INTO product_media(product_id,url,visibility,sort_order) VALUES($1,'https://example.invalid/cover.jpg','public',1) RETURNING id`, p.ID)
	p, err = s.getProduct(ctx, p.ID, false)
	if err != nil || p.CoverURL != "https://example.invalid/cover.jpg" {
		t.Fatal("public cover only", p, err)
	}
	if _, err = s.SubmitSellerProduct(ctx, sellerUser, p.ID); err != nil {
		t.Fatal(err)
	}
	if _, err = s.ApproveProduct(ctx, actor, p.ID); err != nil {
		t.Fatal(err)
	}
	if _, err = s.ConfigureProduct(ctx, sellerUser, p.ID, input); err != errValidation {
		t.Fatal("published mutation", err)
	}
	makeCreator := func(name, code string) (string, *CreatorCommerce) {
		u := user(name)
		profile := scalar(`INSERT INTO profiles(user_id,display_name,slug) VALUES($1,$2,$2) RETURNING id`, u, name)
		scalar(`INSERT INTO creator_profiles(user_id,profile_id,creator_slug,title,status) VALUES($1,$2,$3,$3,'published') RETURNING id`, u, profile, name)
		c, e := s.CreatorCommerce(ctx, u, "")
		if e != nil {
			t.Fatal(e)
		}
		c.StorefrontEnabled = true
		c.PromoEnabled = true
		c.PromoCode = code
		c.ProductIDs = []string{p.ID}
		saved, e := s.SaveCreatorCommerce(ctx, u, *c)
		if e != nil {
			t.Fatal(e)
		}
		if _, e = s.SaveCreatorCommerce(ctx, u, *c); e != errConflict {
			t.Fatal("revision check", e)
		}
		return u, saved
	}
	authorA, a := makeCreator("author-alpha", "ALPHA")
	_, b := makeCreator("author-beta", "BETA")
	if len(a.Products) != 1 || a.Products[0].StorefrontBPS != 1000 {
		t.Fatal("store selection")
	}
	req := CreateOrderRequest{ProductID: p.ID, Quantity: 1, Storefront: a.Slug, PromoCode: b.PromoCode, AcceptedTerms: true}
	q, err := s.CommerceQuote(ctx, buyer, req)
	if err != nil || !q.ChoiceRequired {
		t.Fatal(q, err)
	}
	if _, err = s.CreateOrder(ctx, buyer, req, "conflict-key", "conflict-hash"); err != errAttributionChoice {
		t.Fatal("unresolved attribution", err)
	}
	req.AttributionChoice = "promo"
	req.QuoteFingerprint = "outdated"
	if _, err = s.CreateOrder(ctx, buyer, req, "outdated-key", "outdated-hash"); err != errConflict {
		t.Fatal("changed quote accepted", err)
	}
	q, err = s.CommerceQuote(ctx, buyer, req)
	if err != nil {
		t.Fatal(err)
	}
	req.QuoteFingerprint = q.Fingerprint
	order, err := s.CreateOrder(ctx, buyer, req, "selected-key", "selected-hash")
	if err != nil {
		t.Fatal(err)
	}
	if order.Order.CreatorProfileID != b.CreatorID || order.Deal.CreatorAmountMinor != 19 || order.Deal.SellerAmountMinor != 980 || order.Order.TotalAmountMinor != 999 {
		t.Fatal(order.Order, order.Deal)
	}
	again, err := s.CreateOrder(ctx, buyer, req, "selected-key", "selected-hash")
	if err != nil || again.Order.ID != order.Order.ID {
		t.Fatal("idempotency", err)
	}
	var wg sync.WaitGroup
	results := make(chan string, 6)
	failures := make(chan error, 6)
	concurrentCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	for n := 0; n < 6; n++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			o, e := s.CreateOrder(concurrentCtx, buyer, req, "concurrent-key", "concurrent-hash")
			if e != nil {
				failures <- e
			} else {
				results <- o.Order.ID
			}
		}()
	}
	wg.Wait()
	close(results)
	close(failures)
	for e := range failures {
		t.Fatal("concurrent idempotency", e)
	}
	first := ""
	for id := range results {
		if first != "" && id != first {
			t.Fatal("duplicate concurrent order")
		}
		first = id
	}
	req.QuoteFingerprint = ""
	req.AttributionChoice = "storefront"
	q, err = s.CommerceQuote(ctx, buyer, req)
	if err != nil || q.Allocation.Creator != 99 {
		t.Fatal(q, err)
	}
	if _, err = s.CommerceQuote(ctx, authorA, req); err != errValidation {
		t.Fatal("self referral", err)
	}
	a.StorefrontEnabled = false
	if _, err = s.SaveCreatorCommerce(ctx, authorA, *a); err != nil {
		t.Fatal(err)
	}
	if _, err = s.CommerceQuote(ctx, buyer, req); err != errValidation {
		t.Fatal("disabled store", err)
	}
	req.Storefront = ""
	req.AttributionChoice = ""
	req.PromoCode = "ALPHA"
	q, err = s.CommerceQuote(ctx, buyer, req)
	if err != nil || q.Selected.CreatorID != a.CreatorID {
		t.Fatal("promo independent", q, err)
	}
	req.PromoCode = "NOT-EXIST"
	if _, err = s.CommerceQuote(ctx, buyer, req); err != errValidation {
		t.Fatal("invalid code", err)
	}
	// Тот же canonical ID + другой формат никогда не попадают в список аналогов.
	scalar(`INSERT INTO products(seller_profile_id,category_id,kind,status,title,slug,price_amount_minor,currency,identity_json,variant_key) VALUES($1,$2,'digital_asset','published','Wrong gift','wrong-gift',1,'RUB','{"format":"gift"}', 'other-key') RETURNING id`, seller, category)
	insights, err := s.ProductInsights(ctx, p.ID)
	if err != nil || len(insights.Offers) != 0 || insights.Reference.Status != "insufficient" {
		t.Fatal(insights, err)
	}
	found, err := s.CommerceSearch(ctx, "Sample", "digital_file", "pc", "global", "", "", 20, 0, true)
	if err != nil || len(found.Items) != 1 {
		t.Fatal(found, err)
	}
	found, err = s.CommerceSearch(ctx, "Sample", "gift", "", "", "", "", 20, 0, true)
	if err != nil || len(found.Items) != 0 {
		t.Fatal("format leakage", err)
	}
	copyID := scalar(`INSERT INTO products(seller_profile_id,category_id,kind,status,title,slug,price_amount_minor,currency,identity_json,variant_key) SELECT seller_profile_id,category_id,kind,status,title,'sample-copy',900,currency,identity_json,variant_key FROM products WHERE id=$1 RETURNING id`, p.ID)
	found, err = s.CommerceSearch(ctx, "Sample", "digital_file", "", "", "", "", 20, 0, true)
	if err != nil || len(found.Items) != 1 || found.Items[0].ID != copyID {
		t.Fatal("group representative", found, err)
	}
	found, err = s.CommerceSearch(ctx, "Sample", "digital_file", "", "", "", "", 20, 0, false)
	if err != nil || len(found.Items) != 2 {
		t.Fatal("seller selection", err)
	}
	found, err = s.CommerceSearch(ctx, "Sampel asset", "digital_file", "", "", "", "", 20, 0, true)
	if err != nil || len(found.Items) != 1 {
		t.Fatal("typo matching", found, err)
	}
	// Restricted identity не обходит category gate.
	p2, err := s.CreateSellerProduct(ctx, sellerUser, CreateProductRequest{CategoryID: category, Title: "Restricted test", Description: "An original test asset for development", Terms: "Test delivery within one day", PriceAmountMinor: 999, Currency: "RUB", DeliveryType: "manual"})
	if err != nil {
		t.Fatal(err)
	}
	input.Identity.Format = "shared_account"
	if _, err = s.ConfigureProduct(ctx, sellerUser, p2.ID, input); err != nil {
		t.Fatal(err)
	}
	if _, err = s.SubmitSellerProduct(ctx, sellerUser, p2.ID); err != errValidation {
		t.Fatal("restricted published", err)
	}
}
