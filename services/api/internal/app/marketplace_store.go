package app

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) ListCategories(ctx context.Context, includeRestricted bool) (*ProductCategoryListResponse, error) {
	statusFilter := "status = 'active'"
	if includeRestricted {
		statusFilter = "status IN ('active', 'restricted')"
	}

	rows, err := s.db.Query(ctx, categorySelectSQL()+`
		WHERE `+statusFilter+`
		ORDER BY sort_order, slug
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items, err := scanCategoryRows(rows)
	if err != nil {
		return nil, err
	}

	return &ProductCategoryListResponse{Items: items}, nil
}

func (s *Store) ListPublicProducts(ctx context.Context, categorySlug string, query string, sort string, limit int, offset int) (*ProductListResponse, error) {
	limit, offset = normalizeListLimitOffset(limit, offset)
	categorySlug = normalizeOptionalSlug(categorySlug)
	query = strings.TrimSpace(query)

	conditions := []string{"p.status = 'published'", "p.deleted_at IS NULL", "c.status = 'active'"}
	args := []any{}
	if categorySlug != "" {
		args = append(args, categorySlug)
		conditions = append(conditions, "lower(c.slug) = lower($"+itoa(len(args))+")")
	}
	if query != "" {
		args = append(args, "%"+strings.ToLower(query)+"%")
		conditions = append(conditions, "(lower(p.title) LIKE $"+itoa(len(args))+" OR lower(p.description) LIKE $"+itoa(len(args))+")")
	}

	whereSQL := strings.Join(conditions, " AND ")
	var total int
	if err := s.db.QueryRow(ctx, `
		SELECT count(*)
		FROM products p
		JOIN product_categories c ON c.id = p.category_id
		WHERE `+whereSQL, args...).Scan(&total); err != nil {
		return nil, err
	}

	orderSQL := "p.published_at DESC NULLS LAST, p.created_at DESC"
	switch sort {
	case "price_asc":
		orderSQL = "p.price_amount_minor ASC, p.created_at DESC"
	case "price_desc":
		orderSQL = "p.price_amount_minor DESC, p.created_at DESC"
	}

	args = append(args, limit, offset)
	rows, err := s.db.Query(ctx, productSelectSQL()+`
		WHERE `+whereSQL+`
		ORDER BY `+orderSQL+`
		LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args))+`
	`, args...)
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

func (s *Store) GetPublicProduct(ctx context.Context, idOrSlug string) (*Product, error) {
	product, err := s.getProduct(ctx, idOrSlug, true)
	if err != nil {
		return nil, err
	}

	reviews, err := s.listProductReviews(ctx, product.ID)
	if err != nil {
		return nil, err
	}
	product.Reviews = reviews

	return product, nil
}

func (s *Store) ListSellerProducts(ctx context.Context, userID string, limit int, offset int) (*ProductListResponse, error) {
	seller, err := s.getSellerProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if seller == nil {
		return nil, errForbidden
	}
	limit, offset = normalizeListLimitOffset(limit, offset)

	var total int
	if err := s.db.QueryRow(ctx, `
		SELECT count(*)
		FROM products
		WHERE seller_profile_id = $1 AND deleted_at IS NULL
	`, seller.ID).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, productSelectSQL()+`
		WHERE p.seller_profile_id = $1 AND p.deleted_at IS NULL
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3
	`, seller.ID, limit, offset)
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

func (s *Store) CreateSellerProduct(ctx context.Context, userID string, req CreateProductRequest) (*Product, error) {
	seller, err := s.getSellerProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if seller == nil {
		return nil, errForbidden
	}

	normalized, err := normalizeProductInput(req)
	if err != nil {
		return nil, err
	}

	if err := s.validateCategoryForSellerProduct(ctx, normalized.CategoryID); err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	slugBase := normalized.Slug
	if slugBase == "" {
		slugBase = normalized.Title
	}
	slug, err := s.nextProductSlug(ctx, tx, seller.ID, slugBase)
	if err != nil {
		return nil, err
	}

	var productID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO products (
			seller_profile_id, category_id, kind, title, slug, description, terms,
			price_amount_minor, currency, delivery_type, affiliate_percent_bps
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`, seller.ID, normalized.CategoryID, normalized.Kind, normalized.Title, slug, normalized.Description, normalized.Terms,
		normalized.PriceAmountMinor, normalized.Currency, normalized.DeliveryType, normalized.AffiliatePercentBps).Scan(&productID); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}
		return nil, err
	}

	if err := s.recordAudit(ctx, tx, &userID, "seller.product.create", "product", &productID, nil, nil, nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getProduct(ctx, productID, false)
}

func (s *Store) UpdateSellerProduct(ctx context.Context, userID string, productID string, req UpdateProductRequest) (*Product, error) {
	seller, err := s.getSellerProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if seller == nil {
		return nil, errForbidden
	}

	normalized, err := normalizeProductInput(CreateProductRequest(req))
	if err != nil {
		return nil, err
	}
	if err := s.validateCategoryForSellerProduct(ctx, normalized.CategoryID); err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	current, err := s.getSellerProductForUpdate(ctx, tx, seller.ID, productID)
	if err != nil {
		return nil, err
	}
	if current.Status == "published" || current.Status == "pending_moderation" {
		return nil, errValidation
	}

	slug := current.Slug
	if normalized.Slug != "" && normalized.Slug != current.Slug {
		slug, err = s.nextProductSlug(ctx, tx, seller.ID, normalized.Slug)
		if err != nil {
			return nil, err
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE products
		SET category_id = $1, kind = $2, title = $3, slug = $4, description = $5, terms = $6,
			price_amount_minor = $7, currency = $8, delivery_type = $9, affiliate_percent_bps = $10,
			status = CASE WHEN status = 'rejected' THEN 'draft' ELSE status END,
			moderation_note = CASE WHEN status = 'rejected' THEN '' ELSE moderation_note END
		WHERE id = $11 AND seller_profile_id = $12 AND deleted_at IS NULL
	`, normalized.CategoryID, normalized.Kind, normalized.Title, slug, normalized.Description, normalized.Terms,
		normalized.PriceAmountMinor, normalized.Currency, normalized.DeliveryType, normalized.AffiliatePercentBps, productID, seller.ID); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}
		return nil, err
	}

	if err := s.recordAudit(ctx, tx, &userID, "seller.product.update", "product", &productID, nil, nil, nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getProduct(ctx, productID, false)
}

func (s *Store) SubmitSellerProduct(ctx context.Context, userID string, productID string) (*Product, error) {
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

	product, err := s.getSellerProductForUpdate(ctx, tx, seller.ID, productID)
	if err != nil {
		return nil, err
	}
	if product.Status != "draft" && product.Status != "rejected" {
		return nil, errValidation
	}

	if err := s.validateCategoryForSellerProductTx(ctx, tx, product.CategoryID); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE products
		SET status = 'pending_moderation', moderation_note = ''
		WHERE id = $1 AND seller_profile_id = $2 AND deleted_at IS NULL
	`, product.ID, seller.ID); err != nil {
		return nil, err
	}

	if err := s.recordAudit(ctx, tx, &userID, "seller.product.submit", "product", &product.ID, nil, nil, nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getProduct(ctx, productID, false)
}

func (s *Store) ListAdminProducts(ctx context.Context, status string, limit int, offset int) (*ProductListResponse, error) {
	limit, offset = normalizeListLimitOffset(limit, offset)
	status = strings.TrimSpace(status)
	if status == "" {
		status = "pending_moderation"
	}
	if !validProductStatus(status) {
		return nil, errValidation
	}

	var total int
	if err := s.db.QueryRow(ctx, `
		SELECT count(*)
		FROM products
		WHERE status = $1 AND deleted_at IS NULL
	`, status).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, productSelectSQL()+`
		WHERE p.status = $1 AND p.deleted_at IS NULL
		ORDER BY p.updated_at DESC
		LIMIT $2 OFFSET $3
	`, status, limit, offset)
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

func (s *Store) ApproveProduct(ctx context.Context, actorUserID string, productID string) (*Product, error) {
	return s.moderateProduct(ctx, actorUserID, productID, "published", "")
}

func (s *Store) RejectProduct(ctx context.Context, actorUserID string, productID string, req RejectProductRequest) (*Product, error) {
	note := strings.TrimSpace(req.ModerationNote)
	if note == "" || len(note) > 1000 {
		return nil, errValidation
	}

	return s.moderateProduct(ctx, actorUserID, productID, "rejected", note)
}

func (s *Store) moderateProduct(ctx context.Context, actorUserID string, productID string, status string, note string) (*Product, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	product, err := s.getProductForUpdate(ctx, tx, productID)
	if err != nil {
		return nil, err
	}
	if product.Status != "pending_moderation" {
		return nil, errValidation
	}
	if status == "published" {
		if err := s.validateCategoryForSellerProductTx(ctx, tx, product.CategoryID); err != nil {
			return nil, err
		}
	}

	publishedAtSQL := "published_at"
	if status == "published" {
		publishedAtSQL = "now()"
	}

	if _, err := tx.Exec(ctx, `
		UPDATE products
		SET status = $1, moderation_note = $2, published_at = `+publishedAtSQL+`
		WHERE id = $3 AND deleted_at IS NULL
	`, status, note, product.ID); err != nil {
		return nil, err
	}

	action := "admin.product.reject"
	if status == "published" {
		action = "admin.product.approve"
	}
	if err := s.recordAudit(ctx, tx, &actorUserID, action, "product", &product.ID, nil, nil, map[string]string{
		"status": status,
		"note":   note,
	}); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getProduct(ctx, productID, false)
}

func (s *Store) CreateOrder(ctx context.Context, buyerUserID string, req CreateOrderRequest, idempotencyKey string, requestHash string) (*OrderDetail, error) {
	idempotencyKey = strings.TrimSpace(idempotencyKey)
	if idempotencyKey == "" {
		return nil, errIdempotencyKey
	}
	if !validQuantity(req.Quantity) || !req.AcceptedTerms {
		return nil, errValidation
	}
	if existing, err := s.getIdempotentOrder(ctx, buyerUserID, idempotencyKey, requestHash); err != nil || existing != nil {
		return existing, err
	}

	product, err := s.getProduct(ctx, req.ProductID, true)
	if err != nil {
		return nil, err
	}
	total := product.PriceAmountMinor * int64(req.Quantity)
	paymentResult, err := s.paymentProvider.CreatePayment(ctx, CreatePaymentRequest{
		AmountMinor:    total,
		Currency:       product.Currency,
		Purpose:        "order",
		IdempotencyKey: idempotencyKey,
	})
	if err != nil {
		return nil, err
	}

	snapshot, err := json.Marshal(map[string]any{
		"product_id":    product.ID,
		"title":         product.Title,
		"terms":         product.Terms,
		"price_minor":   product.PriceAmountMinor,
		"currency":      product.Currency,
		"delivery_type": product.DeliveryType,
		"seller_id":     product.SellerProfileID,
	})
	if err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var paymentID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO payments (status, purpose, amount_minor, currency, provider, provider_payment_id, idempotency_key)
		VALUES ($1, 'order', $2, $3, $4, $5, $6)
		RETURNING id
	`, paymentResult.Status, total, product.Currency, paymentResult.Provider, paymentResult.ProviderPaymentID, idempotencyKey).Scan(&paymentID); err != nil {
		return nil, err
	}

	confirmationURL := "/api/v1/mock/payments/" + paymentID + "/succeed"
	if _, err := tx.Exec(ctx, `
		UPDATE payments
		SET confirmation_url = $1
		WHERE id = $2
	`, confirmationURL, paymentID); err != nil {
		return nil, err
	}

	var creatorID *string
	if strings.TrimSpace(req.CreatorProfileID) != "" {
		value := strings.TrimSpace(req.CreatorProfileID)
		creatorID = &value
	}

	var orderID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO orders (
			buyer_user_id, seller_profile_id, product_id, payment_id, status,
			quantity, gross_amount_minor, total_amount_minor, currency,
			terms_snapshot_json, creator_profile_id, promo_code, idempotency_key
		)
		VALUES ($1, $2, $3, $4, 'awaiting_payment', $5, $6, $6, $7, $8::jsonb, $9, $10, $11)
		RETURNING id
	`, buyerUserID, product.SellerProfileID, product.ID, paymentID, req.Quantity, total, product.Currency, string(snapshot), creatorID, strings.TrimSpace(req.PromoCode), idempotencyKey).Scan(&orderID); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}
		return nil, err
	}

	var dealID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO deals (order_id, status, gross_amount_minor, seller_amount_minor, currency)
		VALUES ($1, 'awaiting_payment', $2, $2, $3)
		RETURNING id
	`, orderID, total, product.Currency).Scan(&dealID); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE orders
		SET deal_id = $1
		WHERE id = $2
	`, dealID, orderID); err != nil {
		return nil, err
	}

	if err := s.recordDealEventTx(ctx, tx, dealID, &buyerUserID, "deal.created", "", "awaiting_payment", nil); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO idempotency_keys (scope, idempotency_key, request_hash, order_id, payment_id)
		VALUES ('orders.create', $1, $2, $3, $4)
	`, idempotencyKey, requestHash, orderID, paymentID); err != nil {
		if isUniqueViolation(err) {
			return nil, errIdempotencyConflict
		}
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getOrderDetail(ctx, orderID)
}

func (s *Store) CompleteMockOrderPaymentTx(ctx context.Context, tx pgx.Tx, payment Payment, succeeded bool) (*OrderDetail, error) {
	status := "failed"
	orderStatus := "failed"
	dealStatus := "failed"
	eventType := "payment.failed"
	if succeeded {
		status = "succeeded"
		orderStatus = "paid"
		dealStatus = "held"
		eventType = "payment.succeeded"
	}

	var orderID string
	var dealID string
	var oldDealStatus string
	if err := tx.QueryRow(ctx, `
		SELECT o.id, d.id, d.status
		FROM orders o
		JOIN deals d ON d.id = o.deal_id
		WHERE o.payment_id = $1
		FOR UPDATE OF o, d
	`, payment.ID).Scan(&orderID, &dealID, &oldDealStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	var paidAt any
	if succeeded {
		paidAt = time.Now().UTC()
	}
	if _, err := tx.Exec(ctx, `
		UPDATE payments
		SET status = $1, paid_at = $2
		WHERE id = $3
	`, status, paidAt, payment.ID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE orders
		SET status = $1
		WHERE id = $2
	`, orderStatus, orderID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE deals
		SET status = $1
		WHERE id = $2
	`, dealStatus, dealID); err != nil {
		return nil, err
	}
	if err := s.recordDealEventTx(ctx, tx, dealID, nil, eventType, oldDealStatus, dealStatus, nil); err != nil {
		return nil, err
	}

	return s.getOrderDetailTx(ctx, tx, orderID)
}

func (s *Store) ListBuyerOrders(ctx context.Context, buyerUserID string, limit int, offset int) (*OrderListResponse, error) {
	return s.listOrders(ctx, "o.buyer_user_id = $1", buyerUserID, limit, offset)
}

func (s *Store) ListSellerOrders(ctx context.Context, userID string, limit int, offset int) (*OrderListResponse, error) {
	seller, err := s.getSellerProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if seller == nil {
		return nil, errForbidden
	}

	return s.listOrders(ctx, "o.seller_profile_id = $1", seller.ID, limit, offset)
}

func (s *Store) GetOrderDetailForUser(ctx context.Context, userID string, orderID string) (*OrderDetail, error) {
	detail, err := s.getOrderDetail(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if detail.Order.BuyerUserID == userID {
		return detail, nil
	}
	seller, err := s.getSellerProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if seller != nil && detail.Order.SellerProfileID == seller.ID {
		return detail, nil
	}
	if s.userHasRole(ctx, userID, RoleAdmin) || s.userHasRole(ctx, userID, RoleModerator) {
		return detail, nil
	}

	return nil, errForbidden
}

func (s *Store) StartSellerOrder(ctx context.Context, userID string, orderID string) (*OrderDetail, error) {
	return s.transitionSellerOrder(ctx, userID, orderID, "paid", "held", "in_progress", "seller_working", "seller.order.start")
}

func (s *Store) SubmitSellerOrder(ctx context.Context, userID string, orderID string) (*OrderDetail, error) {
	return s.transitionSellerOrder(ctx, userID, orderID, "in_progress", "seller_working", "delivered", "seller_submitted", "seller.order.submit")
}

func (s *Store) transitionSellerOrder(ctx context.Context, userID string, orderID string, fromOrderStatus string, fromDealStatus string, toOrderStatus string, toDealStatus string, eventType string) (*OrderDetail, error) {
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

	var dealID string
	if err := tx.QueryRow(ctx, `
		SELECT d.id
		FROM orders o
		JOIN deals d ON d.id = o.deal_id
		WHERE o.id = $1 AND o.seller_profile_id = $2 AND o.status = $3 AND d.status = $4
		FOR UPDATE OF o, d
	`, orderID, seller.ID, fromOrderStatus, fromDealStatus).Scan(&dealID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errValidation
		}
		return nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE orders SET status = $1 WHERE id = $2`, toOrderStatus, orderID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE deals SET status = $1 WHERE id = $2`, toDealStatus, dealID); err != nil {
		return nil, err
	}
	if err := s.recordDealEventTx(ctx, tx, dealID, &userID, eventType, fromDealStatus, toDealStatus, nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getOrderDetail(ctx, orderID)
}

func (s *Store) ConfirmBuyerOrder(ctx context.Context, buyerUserID string, orderID string) (*OrderDetail, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var dealID string
	if err := tx.QueryRow(ctx, `
		SELECT d.id
		FROM orders o
		JOIN deals d ON d.id = o.deal_id
		WHERE o.id = $1 AND o.buyer_user_id = $2 AND o.status = 'delivered' AND d.status = 'seller_submitted'
		FOR UPDATE OF o, d
	`, orderID, buyerUserID).Scan(&dealID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errValidation
		}
		return nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE orders SET status = 'completed' WHERE id = $1`, orderID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE deals SET status = 'completed', completed_at = now() WHERE id = $1`, dealID); err != nil {
		return nil, err
	}
	if err := s.recordDealEventTx(ctx, tx, dealID, &buyerUserID, "buyer.order.confirm", "seller_submitted", "completed", nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.getOrderDetail(ctx, orderID)
}

func (s *Store) ReviewOrder(ctx context.Context, buyerUserID string, orderID string, req ReviewOrderRequest) (*Review, error) {
	if !validReviewRating(req.Rating) || !validReviewText(req.Text) {
		return nil, errValidation
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	var sellerID string
	var productID string
	if err := tx.QueryRow(ctx, `
		SELECT seller_profile_id, product_id
		FROM orders
		WHERE id = $1 AND buyer_user_id = $2 AND status = 'completed'
	`, orderID, buyerUserID).Scan(&sellerID, &productID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errValidation
		}
		return nil, err
	}

	var review Review
	if err := tx.QueryRow(ctx, `
		INSERT INTO reviews (order_id, buyer_user_id, seller_profile_id, product_id, rating, text)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, order_id, buyer_user_id, seller_profile_id, product_id, rating, text, status, created_at, updated_at
	`, orderID, buyerUserID, sellerID, productID, req.Rating, strings.TrimSpace(req.Text)).Scan(reviewScanTargets(&review)...); err != nil {
		if isUniqueViolation(err) {
			return nil, errConflict
		}
		return nil, err
	}

	if err := s.recalculateSellerRatingTx(ctx, tx, sellerID); err != nil {
		return nil, err
	}
	if err := s.recordAudit(ctx, tx, &buyerUserID, "buyer.review.create", "review", &review.ID, nil, nil, nil); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &review, nil
}

func (s *Store) listOrders(ctx context.Context, whereSQL string, arg string, limit int, offset int) (*OrderListResponse, error) {
	limit, offset = normalizeListLimitOffset(limit, offset)
	var total int
	if err := s.db.QueryRow(ctx, `
		SELECT count(*)
		FROM orders o
		WHERE `+whereSQL, arg).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT o.id
		FROM orders o
		WHERE `+whereSQL+`
		ORDER BY o.created_at DESC
		LIMIT $2 OFFSET $3
	`, arg, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]OrderDetail, 0, limit)
	for rows.Next() {
		var orderID string
		if err := rows.Scan(&orderID); err != nil {
			return nil, err
		}
		detail, err := s.getOrderDetail(ctx, orderID)
		if err != nil {
			return nil, err
		}
		items = append(items, *detail)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &OrderListResponse{Items: items, Pagination: pagination(limit, offset, total)}, nil
}

func (s *Store) getIdempotentOrder(ctx context.Context, buyerUserID string, idempotencyKey string, requestHash string) (*OrderDetail, error) {
	var storedHash string
	var orderID string
	err := s.db.QueryRow(ctx, `
		SELECT request_hash, order_id
		FROM idempotency_keys
		WHERE scope = 'orders.create' AND idempotency_key = $1
	`, idempotencyKey).Scan(&storedHash, &orderID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if storedHash != requestHash {
		return nil, errIdempotencyConflict
	}

	detail, err := s.getOrderDetail(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if detail.Order.BuyerUserID != buyerUserID {
		return nil, errForbidden
	}

	return detail, nil
}

func (s *Store) getOrderDetail(ctx context.Context, orderID string) (*OrderDetail, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	detail, err := s.getOrderDetailTx(ctx, tx, orderID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return detail, nil
}

func (s *Store) getOrderDetailByPaymentID(ctx context.Context, paymentID string) (*OrderDetail, error) {
	var orderID string
	if err := s.db.QueryRow(ctx, `
		SELECT id
		FROM orders
		WHERE payment_id = $1
	`, paymentID).Scan(&orderID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	return s.getOrderDetail(ctx, orderID)
}

func (s *Store) getOrderDetailTx(ctx context.Context, tx pgx.Tx, orderID string) (*OrderDetail, error) {
	order, err := s.getOrderTx(ctx, tx, orderID)
	if err != nil {
		return nil, err
	}
	deal, err := s.getDealTx(ctx, tx, order.DealID)
	if err != nil {
		return nil, err
	}
	payment, err := s.getPaymentTx(ctx, tx, order.PaymentID)
	if err != nil {
		return nil, err
	}
	product, err := s.getProductTx(ctx, tx, order.ProductID, false)
	if err != nil {
		return nil, err
	}
	review, err := s.getReviewByOrderIDTx(ctx, tx, order.ID)
	if err != nil {
		return nil, err
	}

	return &OrderDetail{Order: *order, Deal: *deal, Payment: *payment, Product: *product, Review: review}, nil
}

func (s *Store) getProduct(ctx context.Context, idOrSlug string, publicOnly bool) (*Product, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer rollbackTx(ctx, tx)

	product, err := s.getProductTx(ctx, tx, idOrSlug, publicOnly)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *Store) getProductTx(ctx context.Context, tx pgx.Tx, idOrSlug string, publicOnly bool) (*Product, error) {
	conditions := "WHERE (p.id::text = $1 OR lower(p.slug) = lower($1)) AND p.deleted_at IS NULL"
	if publicOnly {
		conditions += " AND p.status = 'published' AND c.status = 'active'"
	}

	var product Product
	if err := tx.QueryRow(ctx, productSelectSQL()+" "+conditions+" ORDER BY p.created_at DESC LIMIT 1", strings.TrimSpace(idOrSlug)).Scan(productScanTargets(&product)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	return &product, nil
}

func (s *Store) getSellerProductForUpdate(ctx context.Context, tx pgx.Tx, sellerID string, productID string) (*Product, error) {
	var product Product
	if err := tx.QueryRow(ctx, productSelectSQL()+`
		WHERE p.id = $1 AND p.seller_profile_id = $2 AND p.deleted_at IS NULL
		FOR UPDATE OF p
	`, productID, sellerID).Scan(productScanTargets(&product)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	return &product, nil
}

func (s *Store) getProductForUpdate(ctx context.Context, tx pgx.Tx, productID string) (*Product, error) {
	var product Product
	if err := tx.QueryRow(ctx, productSelectSQL()+`
		WHERE p.id = $1 AND p.deleted_at IS NULL
		FOR UPDATE OF p
	`, productID).Scan(productScanTargets(&product)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	return &product, nil
}

func (s *Store) getOrderTx(ctx context.Context, tx pgx.Tx, orderID string) (*Order, error) {
	var order Order
	if err := tx.QueryRow(ctx, `
		SELECT id, buyer_user_id, seller_profile_id, product_id, COALESCE(deal_id::text, ''),
			payment_id, status, quantity, gross_amount_minor, discount_amount_minor, total_amount_minor,
			currency, terms_snapshot_json, COALESCE(creator_profile_id::text, ''), promo_code, created_at, updated_at
		FROM orders
		WHERE id = $1
	`, orderID).Scan(
		&order.ID,
		&order.BuyerUserID,
		&order.SellerProfileID,
		&order.ProductID,
		&order.DealID,
		&order.PaymentID,
		&order.Status,
		&order.Quantity,
		&order.GrossAmountMinor,
		&order.DiscountAmountMinor,
		&order.TotalAmountMinor,
		&order.Currency,
		&order.TermsSnapshotJSON,
		&order.CreatorProfileID,
		&order.PromoCode,
		&order.CreatedAt,
		&order.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	return &order, nil
}

func (s *Store) getDealTx(ctx context.Context, tx pgx.Tx, dealID string) (*Deal, error) {
	var deal Deal
	if err := tx.QueryRow(ctx, `
		SELECT id, order_id, status, gross_amount_minor, seller_amount_minor, creator_amount_minor,
			platform_fee_minor, provider_fee_minor, currency, buyer_response_deadline_at,
			seller_response_deadline_at, auto_confirm_at, completed_at, created_at, updated_at
		FROM deals
		WHERE id = $1
	`, dealID).Scan(dealScanTargets(&deal)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}

	return &deal, nil
}

func (s *Store) getReviewByOrderIDTx(ctx context.Context, tx pgx.Tx, orderID string) (*Review, error) {
	var review Review
	if err := tx.QueryRow(ctx, `
		SELECT id, order_id, buyer_user_id, seller_profile_id, product_id, rating, text, status, created_at, updated_at
		FROM reviews
		WHERE order_id = $1
	`, orderID).Scan(reviewScanTargets(&review)...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &review, nil
}

func (s *Store) listProductReviews(ctx context.Context, productID string) ([]Review, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, order_id, buyer_user_id, seller_profile_id, product_id, rating, text, status, created_at, updated_at
		FROM reviews
		WHERE product_id = $1 AND status = 'published'
		ORDER BY created_at DESC
		LIMIT 20
	`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Review, 0)
	for rows.Next() {
		var review Review
		if err := rows.Scan(reviewScanTargets(&review)...); err != nil {
			return nil, err
		}
		items = append(items, review)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Store) validateCategoryForSellerProduct(ctx context.Context, categoryID string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer rollbackTx(ctx, tx)
	if err := s.validateCategoryForSellerProductTx(ctx, tx, categoryID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *Store) validateCategoryForSellerProductTx(ctx context.Context, tx pgx.Tx, categoryID string) error {
	var exists bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM product_categories
			WHERE id = $1 AND status = 'active' AND requires_legal_review = false
		)
	`, strings.TrimSpace(categoryID)).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return errValidation
	}

	return nil
}

func (s *Store) nextProductSlug(ctx context.Context, tx pgx.Tx, sellerID string, baseSlug string) (string, error) {
	slug := normalizeSlug(baseSlug)
	for attempt := 0; attempt < 8; attempt++ {
		candidate := slug
		if attempt > 0 {
			candidate = strings.TrimRight(slug, "-")
			if len(candidate) > 72 {
				candidate = candidate[:72]
			}
			candidate = candidate + "-" + randomSuffix(6)
		}

		var exists bool
		if err := tx.QueryRow(ctx, `
			SELECT EXISTS(
				SELECT 1
				FROM products
				WHERE seller_profile_id = $1 AND lower(slug) = lower($2) AND deleted_at IS NULL
			)
		`, sellerID, candidate).Scan(&exists); err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}

	return "", errConflict
}

func (s *Store) recordDealEventTx(ctx context.Context, tx pgx.Tx, dealID string, actorUserID *string, eventType string, fromStatus string, toStatus string, payload any) error {
	payloadValue := []byte(`{}`)
	if payload != nil {
		value, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		payloadValue = value
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO deal_events (deal_id, actor_user_id, event_type, from_status, to_status, payload_json)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, dealID, actorUserID, eventType, fromStatus, toStatus, payloadValue)
	return err
}

func (s *Store) recalculateSellerRatingTx(ctx context.Context, tx pgx.Tx, sellerID string) error {
	_, err := tx.Exec(ctx, `
		UPDATE seller_profiles
		SET rating_avg = stats.rating_avg,
			rating_count = stats.rating_count
		FROM (
			SELECT COALESCE(avg(rating), 0)::numeric(3,2) AS rating_avg, count(*)::int AS rating_count
			FROM reviews
			WHERE seller_profile_id = $1 AND status = 'published'
		) stats
		WHERE id = $1
	`, sellerID)
	return err
}

func normalizeProductInput(req CreateProductRequest) (CreateProductRequest, error) {
	req.CategoryID = strings.TrimSpace(req.CategoryID)
	req.Kind = strings.TrimSpace(req.Kind)
	if req.Kind == "" {
		req.Kind = "digital_asset"
	}
	req.Title = strings.TrimSpace(req.Title)
	req.Slug = normalizeSlug(req.Slug)
	req.Description = strings.TrimSpace(req.Description)
	req.Terms = strings.TrimSpace(req.Terms)
	req.Currency = normalizeCurrency(req.Currency)
	req.DeliveryType = strings.TrimSpace(req.DeliveryType)
	if req.DeliveryType == "" {
		req.DeliveryType = "manual"
	}

	if req.CategoryID == "" ||
		!validProductKind(req.Kind) ||
		!validProductTitle(req.Title) ||
		!validProductDescription(req.Description) ||
		!validProductTerms(req.Terms) ||
		!validProductPrice(req.PriceAmountMinor) ||
		!validCurrency(req.Currency) ||
		!validDeliveryType(req.DeliveryType) ||
		!validAffiliatePercentBps(req.AffiliatePercentBps) {
		return req, errValidation
	}

	return req, nil
}

func categorySelectSQL() string {
	return `
		SELECT id, COALESCE(parent_id::text, ''), slug, name_i18n_key, description_i18n_key,
			status, requires_legal_review, sort_order, created_at, updated_at
		FROM product_categories
	`
}

func categoryScanTargets(category *ProductCategory) []any {
	return []any{
		&category.ID,
		&category.ParentID,
		&category.Slug,
		&category.NameI18nKey,
		&category.DescriptionI18nKey,
		&category.Status,
		&category.RequiresLegalReview,
		&category.SortOrder,
		&category.CreatedAt,
		&category.UpdatedAt,
	}
}

func scanCategoryRows(rows pgx.Rows) ([]ProductCategory, error) {
	items := make([]ProductCategory, 0)
	for rows.Next() {
		var category ProductCategory
		if err := rows.Scan(categoryScanTargets(&category)...); err != nil {
			return nil, err
		}
		items = append(items, category)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func productSelectSQL() string {
	return `
		SELECT
			p.id, p.seller_profile_id, p.category_id, p.kind, p.status, p.title, p.slug,
			p.description, p.terms, p.price_amount_minor, p.currency, p.delivery_type,
			p.affiliate_percent_bps, p.safe_deal_required, p.moderation_note,
			p.published_at, p.created_at, p.updated_at,
			c.id, COALESCE(c.parent_id::text, ''), c.slug, c.name_i18n_key, c.description_i18n_key,
			c.status, c.requires_legal_review, c.sort_order, c.created_at, c.updated_at,
			s.id, s.display_name, s.seller_type, s.status, s.verification_status,
			s.rating_avg::float8, s.rating_count
		FROM products p
		JOIN product_categories c ON c.id = p.category_id
		JOIN seller_profiles s ON s.id = p.seller_profile_id
	`
}

func productScanTargets(product *Product) []any {
	category := &ProductCategory{}
	seller := &SellerSummary{}
	product.Category = category
	product.Seller = seller

	return []any{
		&product.ID,
		&product.SellerProfileID,
		&product.CategoryID,
		&product.Kind,
		&product.Status,
		&product.Title,
		&product.Slug,
		&product.Description,
		&product.Terms,
		&product.PriceAmountMinor,
		&product.Currency,
		&product.DeliveryType,
		&product.AffiliatePercentBps,
		&product.SafeDealRequired,
		&product.ModerationNote,
		&product.PublishedAt,
		&product.CreatedAt,
		&product.UpdatedAt,
		&category.ID,
		&category.ParentID,
		&category.Slug,
		&category.NameI18nKey,
		&category.DescriptionI18nKey,
		&category.Status,
		&category.RequiresLegalReview,
		&category.SortOrder,
		&category.CreatedAt,
		&category.UpdatedAt,
		&seller.ID,
		&seller.DisplayName,
		&seller.SellerType,
		&seller.Status,
		&seller.VerificationStatus,
		&seller.RatingAvg,
		&seller.RatingCount,
	}
}

func scanProductRows(rows pgx.Rows) ([]Product, error) {
	items := make([]Product, 0)
	for rows.Next() {
		var product Product
		if err := rows.Scan(productScanTargets(&product)...); err != nil {
			return nil, err
		}
		items = append(items, product)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func dealScanTargets(deal *Deal) []any {
	return []any{
		&deal.ID,
		&deal.OrderID,
		&deal.Status,
		&deal.GrossAmountMinor,
		&deal.SellerAmountMinor,
		&deal.CreatorAmountMinor,
		&deal.PlatformFeeMinor,
		&deal.ProviderFeeMinor,
		&deal.Currency,
		&deal.BuyerResponseDeadlineAt,
		&deal.SellerResponseDeadlineAt,
		&deal.AutoConfirmAt,
		&deal.CompletedAt,
		&deal.CreatedAt,
		&deal.UpdatedAt,
	}
}

func reviewScanTargets(review *Review) []any {
	return []any{
		&review.ID,
		&review.OrderID,
		&review.BuyerUserID,
		&review.SellerProfileID,
		&review.ProductID,
		&review.Rating,
		&review.Text,
		&review.Status,
		&review.CreatedAt,
		&review.UpdatedAt,
	}
}

func normalizeListLimitOffset(limit int, offset int) (int, int) {
	if limit <= 0 || limit > maxListLimit {
		limit = defaultListLimit
	}
	if offset < 0 {
		offset = 0
	}

	return limit, offset
}

func itoa(value int) string {
	return strconv.Itoa(value)
}
