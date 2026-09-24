package app

import (
	"net/http"
	"strings"
)

func (a *App) handleCategories(w http.ResponseWriter, r *http.Request) {
	includeRestricted := r.URL.Query().Get("include_restricted") == "true"
	response, err := a.store.ListCategories(r.Context(), includeRestricted)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleProducts(w http.ResponseWriter, r *http.Request) {
	response, err := a.store.ListPublicProducts(
		r.Context(),
		r.URL.Query().Get("category"),
		r.URL.Query().Get("query"),
		r.URL.Query().Get("sort"),
		parseQueryInt(r, "limit", defaultListLimit),
		parseQueryInt(r, "offset", 0),
	)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleProductRoutes(w http.ResponseWriter, r *http.Request) {
	idOrSlug := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/products/"), "/")
	if idOrSlug == "" || strings.Contains(idOrSlug, "/") {
		mapError(w, errNotFound)
		return
	}

	product, err := a.store.GetPublicProduct(r.Context(), idOrSlug)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, product)
}

func (a *App) handleSellerProducts(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleSeller)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		response, err := a.store.ListSellerProducts(r.Context(), user.User.ID, parseQueryInt(r, "limit", defaultListLimit), parseQueryInt(r, "offset", 0))
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, response)
	case http.MethodPost:
		var req CreateProductRequest
		if !decodeJSON(w, r, &req) {
			return
		}
		product, err := a.store.CreateSellerProduct(r.Context(), user.User.ID, req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, product)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
	}
}

func (a *App) handleSellerProductRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleSeller)
	if !ok {
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/seller/products/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	productID := parts[0]
	if len(parts) == 2 && parts[1] == "insights" && r.Method == http.MethodGet {
		seller, err := a.store.getSellerProfileByUserID(r.Context(), user.User.ID)
		if err != nil {
			mapError(w, err)
			return
		}
		if seller == nil {
			mapError(w, errForbidden)
			return
		}
		product, err := a.store.getProduct(r.Context(), productID, false)
		if err != nil {
			mapError(w, err)
			return
		}
		if product.SellerProfileID != seller.ID {
			mapError(w, errNotFound)
			return
		}
		result, err := a.store.productInsightsFor(r.Context(), product)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, 200, result)
		return
	}
	if len(parts) == 1 && r.Method == http.MethodGet {
		seller, err := a.store.getSellerProfileByUserID(r.Context(), user.User.ID)
		if err != nil {
			mapError(w, err)
			return
		}
		if seller == nil {
			mapError(w, errForbidden)
			return
		}
		product, err := a.store.getProduct(r.Context(), productID, false)
		if err != nil {
			mapError(w, err)
			return
		}
		if product.SellerProfileID != seller.ID {
			mapError(w, errNotFound)
			return
		}
		writeJSON(w, 200, product)
		return
	}

	if len(parts) == 2 && parts[1] == "commerce" && r.Method == http.MethodPut {
		var req CommerceProductInput
		if !decodeJSON(w, r, &req) {
			return
		}
		product, err := a.store.ConfigureProduct(r.Context(), user.User.ID, productID, req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, product)
		return
	}

	if len(parts) == 1 && r.Method == http.MethodPatch {
		var req UpdateProductRequest
		if !decodeJSON(w, r, &req) {
			return
		}
		product, err := a.store.UpdateSellerProduct(r.Context(), user.User.ID, productID, req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, product)
		return
	}

	if len(parts) == 2 && parts[1] == "submit" && r.Method == http.MethodPost {
		product, err := a.store.SubmitSellerProduct(r.Context(), user.User.ID, productID)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, product)
		return
	}

	writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
}

func (a *App) handleOrders(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleBuyer)
	if !ok {
		return
	}

	var req CreateOrderRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	requestHash, err := canonicalRequestHash(req)
	if err != nil {
		mapError(w, err)
		return
	}

	response, err := a.store.CreateOrder(r.Context(), user.User.ID, req, r.Header.Get("Idempotency-Key"), requestHash)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func (a *App) handleOrderRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireAuth(w, r)
	if !ok {
		return
	}

	orderID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/orders/"), "/")
	if orderID == "" || strings.Contains(orderID, "/") {
		mapError(w, errNotFound)
		return
	}

	response, err := a.store.GetOrderDetailForUser(r.Context(), user.User.ID, orderID)
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleBuyerOrders(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleBuyer)
	if !ok {
		return
	}

	response, err := a.store.ListBuyerOrders(r.Context(), user.User.ID, parseQueryInt(r, "limit", defaultListLimit), parseQueryInt(r, "offset", 0))
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleBuyerOrderRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleBuyer)
	if !ok {
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/buyer/orders/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	switch {
	case parts[1] == "confirm" && r.Method == http.MethodPost:
		response, err := a.store.ConfirmBuyerOrder(r.Context(), user.User.ID, parts[0])
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, response)
	case parts[1] == "review" && r.Method == http.MethodPost:
		var req ReviewOrderRequest
		if !decodeJSON(w, r, &req) {
			return
		}
		response, err := a.store.ReviewOrder(r.Context(), user.User.ID, parts[0], req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, response)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
	}
}

func (a *App) handleSellerOrders(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleSeller)
	if !ok {
		return
	}

	response, err := a.store.ListSellerOrders(r.Context(), user.User.ID, parseQueryInt(r, "limit", defaultListLimit), parseQueryInt(r, "offset", 0))
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleSellerOrderRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleSeller)
	if !ok {
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/seller/orders/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	var response *OrderDetail
	var err error
	switch {
	case parts[1] == "start" && r.Method == http.MethodPost:
		response, err = a.store.StartSellerOrder(r.Context(), user.User.ID, parts[0])
	case parts[1] == "submit" && r.Method == http.MethodPost:
		response, err = a.store.SubmitSellerOrder(r.Context(), user.User.ID, parts[0])
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
		return
	}
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleAdminProducts(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleAdmin, RoleModerator)
	if !ok || user == nil {
		return
	}

	response, err := a.store.ListAdminProducts(r.Context(), r.URL.Query().Get("status"), parseQueryInt(r, "limit", defaultListLimit), parseQueryInt(r, "offset", 0))
	if err != nil {
		mapError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleAdminProductRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRole(w, r, RoleAdmin, RoleModerator)
	if !ok || user == nil {
		return
	}

	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/admin/products/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[0] == "" {
		mapError(w, errNotFound)
		return
	}

	switch {
	case parts[1] == "approve" && r.Method == http.MethodPost:
		product, err := a.store.ApproveProduct(r.Context(), user.User.ID, parts[0])
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, product)
	case parts[1] == "reject" && r.Method == http.MethodPost:
		var req RejectProductRequest
		if !decodeJSON(w, r, &req) {
			return
		}
		product, err := a.store.RejectProduct(r.Context(), user.User.ID, parts[0], req)
		if err != nil {
			mapError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, product)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method_not_allowed", "errors.methodNotAllowed", nil)
	}
}
