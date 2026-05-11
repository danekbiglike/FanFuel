package app

import (
	"context"
)

type CreatePaymentRequest struct {
	AmountMinor    int64
	Currency       string
	Purpose        string
	IdempotencyKey string
}

type PaymentResult struct {
	Provider          string
	ProviderPaymentID string
	Status            string
}

type PaymentProvider interface {
	CreatePayment(ctx context.Context, req CreatePaymentRequest) (*PaymentResult, error)
}

type MockPaymentProvider struct{}

func NewMockPaymentProvider() PaymentProvider {
	return MockPaymentProvider{}
}

func (MockPaymentProvider) CreatePayment(_ context.Context, req CreatePaymentRequest) (*PaymentResult, error) {
	providerPaymentID := "mock_" + randomSuffix(24)
	return &PaymentResult{
		Provider:          "mock",
		ProviderPaymentID: providerPaymentID,
		Status:            "pending",
	}, nil
}
