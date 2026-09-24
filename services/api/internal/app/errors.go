package app

import (
	"encoding/json"
	"errors"
	"net/http"
)

var (
	errInvalidCredentials            = errors.New("invalid credentials")
	errForbidden                     = errors.New("forbidden")
	errNotFound                      = errors.New("not found")
	errAttributionChoice             = errors.New("attribution choice required")
	errValidation                    = errors.New("validation failed")
	errConflict                      = errors.New("conflict")
	errIdempotencyKey                = errors.New("idempotency key required")
	errIdempotencyConflict           = errors.New("idempotency key conflict")
	errVerificationCodeInvalid       = errors.New("verification code invalid")
	errVerificationCodeExpired       = errors.New("verification code expired")
	errVerificationAttemptsExhausted = errors.New("verification attempts exhausted")
	errVerificationResendLimited     = errors.New("verification resend limited")
	errVerificationTokenInvalid      = errors.New("verification token invalid")
	errEmailDelivery                 = errors.New("email delivery failed")
)

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	I18nKey string `json:"i18n_key"`
	Details any    `json:"details,omitempty"`
}

type errorResponse struct {
	Error apiError `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeNoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func writeError(w http.ResponseWriter, status int, code string, message string, i18nKey string, details any) {
	writeJSON(w, status, errorResponse{
		Error: apiError{
			Code:    code,
			Message: message,
			I18nKey: i18nKey,
			Details: details,
		},
	})
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, errAttributionChoice):
		writeError(w, 409, "attribution_choice_required", "attribution_choice_required", "errors.attributionChoiceRequired", nil)
	case errors.Is(err, errInvalidCredentials):
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "invalid_credentials", "errors.invalidCredentials", nil)
	case errors.Is(err, errForbidden):
		writeError(w, http.StatusForbidden, "forbidden", "forbidden", "errors.forbidden", nil)
	case errors.Is(err, errNotFound):
		writeError(w, http.StatusNotFound, "not_found", "not_found", "errors.notFound", nil)
	case errors.Is(err, errConflict):
		writeError(w, http.StatusConflict, "conflict", "conflict", "errors.conflict", nil)
	case errors.Is(err, errIdempotencyKey):
		writeError(w, http.StatusBadRequest, "idempotency_key_required", "idempotency_key_required", "errors.idempotencyKeyRequired", nil)
	case errors.Is(err, errIdempotencyConflict):
		writeError(w, http.StatusConflict, "idempotency_key_conflict", "idempotency_key_conflict", "errors.idempotencyKeyConflict", nil)
	case errors.Is(err, errValidation):
		writeError(w, http.StatusBadRequest, "validation_failed", "validation_failed", "errors.validationFailed", nil)
	case errors.Is(err, errVerificationCodeInvalid):
		writeError(w, http.StatusBadRequest, "verification_code_invalid", "verification_code_invalid", "errors.verificationCodeInvalid", nil)
	case errors.Is(err, errVerificationCodeExpired):
		writeError(w, http.StatusGone, "verification_code_expired", "verification_code_expired", "errors.verificationCodeExpired", nil)
	case errors.Is(err, errVerificationAttemptsExhausted):
		writeError(w, http.StatusTooManyRequests, "verification_attempts_exhausted", "verification_attempts_exhausted", "errors.verificationAttemptsExhausted", nil)
	case errors.Is(err, errVerificationResendLimited):
		writeError(w, http.StatusTooManyRequests, "verification_resend_limited", "verification_resend_limited", "errors.verificationResendLimited", nil)
	case errors.Is(err, errVerificationTokenInvalid):
		writeError(w, http.StatusUnauthorized, "verification_token_invalid", "verification_token_invalid", "errors.verificationTokenInvalid", nil)
	case errors.Is(err, errEmailDelivery):
		writeError(w, http.StatusServiceUnavailable, "email_delivery_failed", "email_delivery_failed", "errors.emailDeliveryFailed", nil)
	default:
		writeError(w, http.StatusInternalServerError, "internal_error", "internal_error", "errors.internal", nil)
	}
}
