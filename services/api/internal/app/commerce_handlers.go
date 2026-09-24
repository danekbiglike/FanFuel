package app

import (
	"net/http"
	"strings"
)

func (a *App) handleCommerce(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, 405, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}
	if !a.commerceLimiter.Allow(clientKey(r)) {
		writeError(w, 429, "rate_limited", "rate_limited", "errors.rateLimited", nil)
		return
	}
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/commerce/"), "/")
	q := r.URL.Query()
	var result any
	var err error
	switch {
	case path == "search":
		result, err = a.store.CommerceSearch(r.Context(), q.Get("query"), q.Get("format"), q.Get("platform"), q.Get("region"), q.Get("category"), q.Get("sort"), parseQueryInt(r, "limit", 20), parseQueryInt(r, "offset", 0), q.Get("group_equivalent") != "false")
	case path == "quote":
		buyerID := ""
		if r.Header.Get("Authorization") != "" {
			user, ok := a.requireAuth(w, r)
			if !ok {
				return
			}
			buyerID = user.User.ID
		}
		result, err = a.store.CommerceQuote(r.Context(), buyerID, CreateOrderRequest{ProductID: q.Get("product_id"), Quantity: parseQueryInt(r, "quantity", 1), Storefront: q.Get("storefront"), PromoCode: q.Get("promo_code"), AttributionChoice: q.Get("attribution_choice")})
	case strings.HasPrefix(path, "products/"):
		result, err = a.store.ProductInsights(r.Context(), strings.TrimPrefix(path, "products/"))
	case strings.HasPrefix(path, "creators/"):
		result, err = a.store.CreatorCommerce(r.Context(), "", strings.TrimPrefix(path, "creators/"))
	default:
		err = errNotFound
	}
	if err != nil {
		mapError(w, err)
		return
	}
	writeJSON(w, 200, result)
}
func (a *App) handleStudioCommerce(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}
	var result *CreatorCommerce
	var err error
	switch r.Method {
	case http.MethodGet:
		result, err = a.store.CreatorCommerce(r.Context(), user.User.ID, "")
	case http.MethodPut:
		var req CreatorCommerce
		if !decodeJSON(w, r, &req) {
			return
		}
		result, err = a.store.SaveCreatorCommerce(r.Context(), user.User.ID, req)
	default:
		writeError(w, 405, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}
	if err != nil {
		mapError(w, err)
		return
	}
	writeJSON(w, 200, result)
}
