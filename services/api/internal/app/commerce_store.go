package app

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/fanfuel/fanfuel/services/api/internal/commerce"
	"github.com/jackc/pgx/v5"
)

func (s *Store) ConfigureProduct(ctx context.Context, userID, id string, req CommerceProductInput) (*Product, error) {
	identity, err := req.Identity.Canonical()
	if err != nil {
		return nil, errValidation
	}
	if (commerce.Rates{Promo: req.PromoBPS, Storefront: req.StorefrontBPS}).Validate() != nil {
		return nil, errValidation
	}
	seller, err := s.getSellerProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if seller == nil {
		return nil, errForbidden
	}
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)
	product, err := s.getSellerProductForUpdate(ctx, tx, seller.ID, id)
	if err != nil {
		return nil, err
	}
	if product.Status != "draft" && product.Status != "rejected" {
		return nil, errValidation
	}
	var workID string
	err = tx.QueryRow(ctx, `INSERT INTO catalog_works(source_key,title) VALUES($1,$2) ON CONFLICT(source_key) DO UPDATE SET source_key=excluded.source_key RETURNING id`, identity.WorkKey(seller.ID), identity.WorkTitle).Scan(&workID)
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(identity)
	_, err = tx.Exec(ctx, `UPDATE products SET identity_json=$2::jsonb,variant_key=$3,work_id=$4,promo_bps=$5,storefront_bps=$6,commission_configured=true,affiliate_percent_bps=$6 WHERE id=$1`, id, string(raw), identity.VariantKey(seller.ID), workID, req.PromoBPS, req.StorefrontBPS)
	if err != nil {
		return nil, err
	}
	if err = s.recordAudit(ctx, tx, &userID, "seller.product.commerce", "product", &id, nil, nil, req); err != nil {
		return nil, err
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}
	return s.getProduct(ctx, id, false)
}

func defaultStoreDesign() StoreDesign {
	return StoreDesign{Banner: "lime", Avatar: "oily", Accent: "lime", Layout: "grid", Blocks: []string{"products", "about", "donation"}, DonatePlacement: "button"}
}
func validStoreDesign(d StoreDesign) bool {
	for _, id := range []string{d.AvatarMediaID, d.BannerMediaID} {
		if id != "" && !mediaIDPattern.MatchString(id) {
			return false
		}
	}
	contains := func(v string, allowed ...string) bool {
		for _, a := range allowed {
			if v == a {
				return true
			}
		}
		return false
	}
	if !contains(d.Banner, "lime", "ink", "grid") || !contains(d.Avatar, "oily", "letter", "canister") || !contains(d.Accent, "lime", "neutral") || !contains(d.Layout, "grid", "list") || !contains(d.DonatePlacement, "button", "block", "hidden") || len([]rune(d.Headline)) > 120 || len([]rune(d.About)) > 1500 || len(d.Blocks) > 3 {
		return false
	}
	seen := map[string]bool{}
	for _, b := range d.Blocks {
		if !contains(b, "products", "about", "donation") || seen[b] {
			return false
		}
		seen[b] = true
	}
	return len(d.Blocks) > 0
}
func (s *Store) CreatorCommerce(ctx context.Context, userID, slug string) (*CreatorCommerce, error) {
	out := &CreatorCommerce{Design: defaultStoreDesign(), Products: []Product{}, ProductIDs: []string{}, Stats: []CommerceStat{}}
	filter := "c.user_id::text=$1"
	arg := userID
	if slug != "" {
		filter = "lower(c.creator_slug)=lower($1) AND c.status='published'"
		arg = slug
	}
	var design []byte
	err := s.db.QueryRow(ctx, `SELECT c.id,c.creator_slug,c.title,c.status='published',c.donations_enabled,
 COALESCE(x.storefront_enabled,false),COALESCE(x.promo_enabled,false),COALESCE(x.promo_code,''),COALESCE(x.design_json,'{}'::jsonb),COALESCE(x.revision,0)
 FROM creator_profiles c JOIN users u ON u.id=c.user_id LEFT JOIN creator_commerce x ON x.creator_profile_id=c.id
 WHERE `+filter+` AND c.status<>'blocked' AND u.status='active' AND u.deleted_at IS NULL`, arg).Scan(&out.CreatorID, &out.Slug, &out.Title, &out.Published, &out.DonationsEnabled, &out.StorefrontEnabled, &out.PromoEnabled, &out.PromoCode, &design, &out.Revision)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errNotFound
	}
	if err != nil {
		return nil, err
	}
	if string(design) != "{}" {
		if err = json.Unmarshal(design, &out.Design); err != nil {
			return nil, err
		}
	}
	if slug != "" && !out.StorefrontEnabled {
		out.Products = []Product{}
		return out, nil
	}
	rows, err := s.db.Query(ctx, productSelectSQL()+` JOIN creator_store_products sp ON sp.product_id=p.id WHERE sp.creator_profile_id=$1 AND p.status='published' AND p.deleted_at IS NULL AND c.status='active' AND s.status='active' ORDER BY sp.position LIMIT 100`, out.CreatorID)
	if err != nil {
		return nil, err
	}
	out.Products, err = scanProductRows(rows)
	rows.Close()
	if err != nil {
		return nil, err
	}
	for _, p := range out.Products {
		out.ProductIDs = append(out.ProductIDs, p.ID)
	}
	if userID != "" {
		rows, err = s.db.Query(ctx, `SELECT o.currency,count(*),COALESCE(sum(d.creator_amount_minor) FILTER(WHERE o.status IN ('paid','in_progress','delivered')),0),COALESCE(sum(d.creator_amount_minor) FILTER(WHERE o.status='completed'),0) FROM orders o JOIN deals d ON d.id=o.deal_id WHERE o.creator_profile_id=$1 GROUP BY o.currency`, out.CreatorID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		for rows.Next() {
			var st CommerceStat
			if err = rows.Scan(&st.Currency, &st.Orders, &st.Pending, &st.Completed); err != nil {
				return nil, err
			}
			out.Stats = append(out.Stats, st)
		}
		if err = rows.Err(); err != nil {
			return nil, err
		}
	}
	return out, nil
}
func (s *Store) SaveCreatorCommerce(ctx context.Context, userID string, req CreatorCommerce) (*CreatorCommerce, error) {
	if !validStoreDesign(req.Design) || req.Revision < 0 || len(req.ProductIDs) > 100 {
		return nil, errValidation
	}
	code := ""
	var err error
	if req.PromoCode != "" {
		code, err = commerce.PromoCode(req.PromoCode)
		if err != nil {
			return nil, errValidation
		}
	}
	if req.PromoEnabled && code == "" {
		return nil, errValidation
	}
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)
	var creatorID string
	err = tx.QueryRow(ctx, `SELECT id FROM creator_profiles WHERE user_id=$1 AND status<>'blocked' FOR UPDATE`, userID).Scan(&creatorID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errForbidden
	}
	if err != nil {
		return nil, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO creator_commerce(creator_profile_id) VALUES($1) ON CONFLICT DO NOTHING`, creatorID); err != nil {
		return nil, err
	}
	for purpose, id := range map[string]string{"creator_avatar": req.Design.AvatarMediaID, "creator_banner": req.Design.BannerMediaID} {
		if id == "" {
			continue
		}
		var exists bool
		if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM media_assets WHERE id=$1 AND owner_user_id=$2 AND purpose=$3 AND status='ready')`, id, userID, purpose).Scan(&exists); err != nil {
			return nil, err
		}
		if !exists {
			return nil, errForbidden
		}
	}
	raw, _ := json.Marshal(req.Design)
	result, err := tx.Exec(ctx, `UPDATE creator_commerce SET storefront_enabled=$2,promo_enabled=$3,promo_code=NULLIF($4,''),design_json=$5::jsonb,revision=revision+1 WHERE creator_profile_id=$1 AND revision=$6`, creatorID, req.StorefrontEnabled, req.PromoEnabled, code, string(raw), req.Revision)
	if isUniqueViolation(err) {
		return nil, errConflict
	}
	if err != nil {
		return nil, err
	}
	if result.RowsAffected() != 1 {
		return nil, errConflict
	}
	if _, err = tx.Exec(ctx, `DELETE FROM creator_store_products WHERE creator_profile_id=$1`, creatorID); err != nil {
		return nil, err
	}
	seen := map[string]bool{}
	for n, id := range req.ProductIDs {
		if seen[id] {
			return nil, errValidation
		}
		seen[id] = true
		result, err = tx.Exec(ctx, `INSERT INTO creator_store_products(creator_profile_id,product_id,position) SELECT $1,p.id,$3 FROM products p JOIN product_categories c ON c.id=p.category_id JOIN seller_profiles s ON s.id=p.seller_profile_id WHERE p.id::text=$2 AND p.status='published' AND p.deleted_at IS NULL AND p.commission_configured AND c.status='active' AND s.status='active'`, creatorID, id, n)
		if err != nil {
			return nil, err
		}
		if result.RowsAffected() != 1 {
			return nil, errValidation
		}
	}
	if err = s.recordAudit(ctx, tx, &userID, "creator.commerce.update", "creator_profile", &creatorID, nil, nil, map[string]any{"revision": req.Revision + 1, "products": len(req.ProductIDs)}); err != nil {
		return nil, err
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}
	return s.CreatorCommerce(ctx, userID, "")
}

func (s *Store) ProductInsights(ctx context.Context, id string) (*ProductInsights, error) {
	p, err := s.GetPublicProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.productInsightsFor(ctx, p)
}
func (s *Store) productInsightsFor(ctx context.Context, p *Product) (*ProductInsights, error) {
	out := &ProductInsights{Product: *p, Offers: []Product{}, Conversion: commerce.Conversion(0, 0, false)}
	observations := []commerce.Observation{}
	if p.VariantKey != "" {
		rows, err := s.db.Query(ctx, productSelectSQL()+` WHERE p.variant_key=$1 AND p.currency=$2 AND p.status='published' AND p.deleted_at IS NULL AND c.status='active' AND s.status='active' ORDER BY p.price_amount_minor,p.id LIMIT 12`, p.VariantKey, p.Currency)
		if err != nil {
			return nil, err
		}
		candidates, err := scanProductRows(rows)
		rows.Close()
		if err != nil {
			return nil, err
		}
		for _, x := range candidates {
			if x.ID != p.ID && len(out.Offers) < 12 {
				out.Offers = append(out.Offers, x)
			}
		}
		// Выборка ориентира независима от дешёвых карточек: по одному наблюдению на продавца.
		rows, err = s.db.Query(ctx, `SELECT p.seller_profile_id,min(p.price_amount_minor),max(p.updated_at) FROM products p JOIN seller_profiles s ON s.id=p.seller_profile_id JOIN product_categories c ON c.id=p.category_id WHERE p.variant_key=$1 AND p.currency=$2 AND p.status='published' AND p.deleted_at IS NULL AND c.status='active' AND s.status='active' AND p.updated_at>=now()-interval '30 days' GROUP BY p.seller_profile_id ORDER BY max(p.updated_at) DESC,p.seller_profile_id LIMIT 1001`, p.VariantKey, p.Currency)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			o := commerce.Observation{Variant: p.VariantKey, Currency: p.Currency, Eligible: true}
			if err = rows.Scan(&o.SellerID, &o.Amount, &o.At); err != nil {
				rows.Close()
				return nil, err
			}
			observations = append(observations, o)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return nil, err
		}
	}
	out.Reference = commerce.MarketPrice(observations, p.VariantKey, p.Currency, time.Now().UTC())
	if len(observations) > 1000 {
		out.Reference = commerce.PriceReference{Status: "sample_limited", Sellers: len(observations), AsOf: time.Now().UTC()}
	}
	out.Signals = commerce.PriceSignals(p.PriceAmountMinor, p.StorefrontBPS, out.Reference)
	return out, nil
}

func (s *Store) quoteTx(ctx context.Context, tx pgx.Tx, p *Product, buyerID string, req CreateOrderRequest) (*CommerceQuote, error) {
	if !validQuantity(req.Quantity) || p.Seller == nil || p.Seller.Status != "active" {
		return nil, errValidation
	}
	total, err := commerce.Total(p.PriceAmountMinor, req.Quantity)
	if err != nil {
		return nil, errValidation
	}
	out := &CommerceQuote{ProductID: p.ID, Currency: p.Currency, Quantity: req.Quantity}
	if req.CreatorProfileID != "" && req.Storefront == "" {
		return nil, errValidation
	}
	if !p.CommissionConfigured && (req.Storefront != "" || req.PromoCode != "") {
		return nil, errValidation
	}
	lookup := func(channel, source string) (*commerce.Candidate, error) {
		if source == "" {
			return nil, nil
		}
		filter := "x.storefront_enabled AND lower(c.creator_slug)=lower($1) AND EXISTS(SELECT 1 FROM creator_store_products sp WHERE sp.creator_profile_id=c.id AND sp.product_id=$2)"
		bps := p.StorefrontBPS
		if channel == "promo" {
			filter = "x.promo_enabled AND x.promo_code=$1"
			bps = p.PromoBPS
			var e error
			source, e = commerce.PromoCode(source)
			if e != nil {
				return nil, errValidation
			}
			out.PromoCode = source
		}
		candidate := &commerce.Candidate{Channel: channel, BPS: bps}
		var owner string
		// Общая блокировка конфигурации предотвращает её изменение во время формирования заказа.
		e := tx.QueryRow(ctx, `SELECT c.id,c.title,c.user_id FROM creator_commerce x JOIN creator_profiles c ON c.id=x.creator_profile_id JOIN users u ON u.id=c.user_id WHERE `+filter+` AND c.status='published' AND u.status='active' AND u.deleted_at IS NULL AND $2::uuid IS NOT NULL FOR SHARE OF x,c`, source, p.ID).Scan(&candidate.CreatorID, &candidate.CreatorName, &owner)
		if errors.Is(e, pgx.ErrNoRows) {
			return nil, errValidation
		}
		if e != nil {
			return nil, e
		}
		if owner == buyerID {
			return nil, errValidation
		}
		var sellerOwner string
		if e = tx.QueryRow(ctx, `SELECT user_id FROM seller_profiles WHERE id=$1`, p.SellerProfileID).Scan(&sellerOwner); e != nil {
			return nil, e
		}
		if sellerOwner == owner {
			return nil, errValidation
		}
		return candidate, nil
	}
	out.Storefront, err = lookup("storefront", strings.TrimSpace(req.Storefront))
	if err != nil {
		return nil, err
	}
	out.Promo, err = lookup("promo", strings.TrimSpace(req.PromoCode))
	if err != nil {
		return nil, err
	}
	out.Selected, err = commerce.Choose(out.Storefront, out.Promo, req.AttributionChoice)
	if errors.Is(err, commerce.ErrChoice) {
		out.ChoiceRequired = true
	} else if err != nil {
		return nil, errValidation
	}
	bps := 0
	if out.Selected != nil {
		bps = out.Selected.BPS
	}
	out.Allocation, err = commerce.Allocate(total, bps, 0)
	if err != nil {
		return nil, errValidation
	}
	out.Fingerprint, err = canonicalRequestHash(map[string]any{"quote": out, "product_updated_at": p.UpdatedAt})
	if err != nil {
		return nil, err
	}
	return out, nil
}
func (s *Store) CommerceQuote(ctx context.Context, buyerID string, req CreateOrderRequest) (*CommerceQuote, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)
	p, err := s.getProductTx(ctx, tx, req.ProductID, true)
	if err != nil {
		return nil, err
	}
	return s.quoteTx(ctx, tx, p, buyerID, req)
}

func (s *Store) CommerceSearch(ctx context.Context, query, format, platform, region, category, sortBy string, limit, offset int, grouped bool) (*ProductListResponse, error) {
	if len([]rune(query)) > 160 || len(format) > 40 || len(platform) > 100 || len(region) > 100 || offset > 10000 {
		return nil, errValidation
	}
	limit, offset = normalizeListLimitOffset(limit, offset)
	intent := commerce.ParseIntent(query)
	if format == "" && !intent.Ambiguous {
		format = intent.Format
	}
	if intent.Format != "" && format == intent.Format {
		query = intent.Text
	}
	args := []any{strings.TrimSpace(query), format, commerce.Normalize(platform), commerce.Normalize(region), category}
	where := `p.status='published' AND p.deleted_at IS NULL AND c.status='active' AND s.status='active' AND ($2='' OR p.identity_json->>'format'=$2) AND ($3='' OR p.identity_json->>'platform'=$3) AND ($4='' OR p.identity_json->>'region'=$4) AND ($5='' OR c.slug=$5) AND ($1='' OR to_tsvector('simple',p.title||' '||p.description) @@ websearch_to_tsquery('simple',$1) OR to_tsvector('russian',p.title||' '||p.description) @@ websearch_to_tsquery('russian',$1) OR (char_length($1)>=4 AND lower(p.title) % lower($1)) OR position(lower($1) in lower(p.title))>0)`
	selection := `SELECT p.id FROM products p JOIN product_categories c ON c.id=p.category_id JOIN seller_profiles s ON s.id=p.seller_profile_id WHERE ` + where
	if grouped {
		groupKey := `CASE WHEN p.variant_key='' THEN p.id::text ELSE p.variant_key||':'||p.currency END`
		selection = `SELECT DISTINCT ON (` + groupKey + `) p.id FROM products p JOIN product_categories c ON c.id=p.category_id JOIN seller_profiles s ON s.id=p.seller_profile_id WHERE ` + where + ` ORDER BY ` + groupKey + `,p.price_amount_minor,p.id`
	}
	var total int
	if err := s.db.QueryRow(ctx, `SELECT count(*) FROM (`+selection+`) matched`, args...).Scan(&total); err != nil {
		return nil, err
	}
	order := `(CASE WHEN lower(p.title)=lower($1) AND $1<>'' THEN 4 ELSE 0 END + ts_rank_cd(to_tsvector('simple',p.title||' '||p.description),websearch_to_tsquery('simple',$1)) + ts_rank_cd(to_tsvector('russian',p.title||' '||p.description),websearch_to_tsquery('russian',$1)) + similarity(lower(p.title),lower($1))*.2) DESC,p.published_at DESC NULLS LAST,p.id`
	if sortBy == "price_asc" {
		order = "p.currency,p.price_amount_minor,p.id"
	}
	if sortBy == "price_desc" {
		order = "p.currency,p.price_amount_minor DESC,p.id"
	}
	args = append(args, limit, offset)
	rows, err := s.db.Query(ctx, productSelectSQL()+` WHERE p.id IN (`+selection+`) ORDER BY `+order+` LIMIT $6 OFFSET $7`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items, err := scanProductRows(rows)
	if err != nil {
		return nil, err
	}
	return &ProductListResponse{Items: items, Pagination: pagination(limit, offset, total)}, nil
}
