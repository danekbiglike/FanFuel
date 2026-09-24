package commerce

import (
	"errors"
	"time"
)

var ErrUnavailable = errors.New("insufficient available inventory")
var ErrReplay = errors.New("reservation key reused with different input")

type Reservation struct {
	ID        string
	Quantity  int
	ExpiresAt time.Time
	Committed bool
}

// PlanReservation — чистый план. В адаптере необходимо блокировать inventory row и
// сохранять результат одной транзакцией; вычисление само по себе не резервирует склад.
func PlanReservation(stock int, holds []Reservation, id string, quantity int, now time.Time, ttl time.Duration) (Reservation, error) {
	if stock < 0 || quantity < 1 || quantity > 20 || id == "" || ttl <= 0 || ttl > time.Hour {
		return Reservation{}, ErrInvalid
	}
	available := stock
	for _, h := range holds {
		if h.ID == id {
			if h.Quantity != quantity {
				return Reservation{}, ErrReplay
			}
			if h.Committed || h.ExpiresAt.After(now) {
				return h, nil
			}
			return Reservation{}, ErrReplay
		}
		// Stock уже уменьшен для committed резервов. Повторное вычитание запрещено.
		if !h.Committed && h.ExpiresAt.After(now) {
			if h.Quantity < 0 {
				return Reservation{}, ErrInvalid
			}
			if h.Quantity > available {
				available = 0
			} else {
				available -= h.Quantity
			}
		}
	}
	if quantity > available {
		return Reservation{}, ErrUnavailable
	}
	return Reservation{ID: id, Quantity: quantity, ExpiresAt: now.Add(ttl)}, nil
}

type RiskSignal struct {
	Code   string
	Review bool
	Sample int64
	Low    float64
	High   float64
}

// Жалобы не доказывают мошенничество. Флаг только направляет на ручную проверку.
func ComplaintSignal(delivered, disputed int64, baseline float64) RiskSignal {
	estimate := Conversion(delivered, disputed, true)
	out := RiskSignal{Code: "insufficient", Sample: delivered}
	if baseline < 0 || baseline > 1 || estimate.Status == "invalid" {
		out.Code = "invalid"
		return out
	}
	if estimate.Status != "estimated" {
		return out
	}
	out.Low = estimate.Low
	out.High = estimate.High
	out.Code = "within_baseline"
	if estimate.Low > baseline {
		out.Code = "review_dispute_rate"
		out.Review = true
	}
	return out
}
