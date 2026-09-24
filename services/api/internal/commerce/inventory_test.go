package commerce

import (
	"testing"
	"time"
)

func TestReservationReplayAndExpiry(t *testing.T) {
	now := time.Now()
	a, e := PlanReservation(2, nil, "a", 1, now, time.Minute)
	if e != nil {
		t.Fatal(e)
	}
	again, e := PlanReservation(2, []Reservation{a}, "a", 1, now, time.Minute)
	if e != nil || again != a {
		t.Fatal("not idempotent")
	}
	if _, e = PlanReservation(2, []Reservation{a}, "a", 2, now, time.Minute); e != ErrReplay {
		t.Fatal("key collision")
	}
	if _, e = PlanReservation(2, []Reservation{a}, "b", 2, now, time.Minute); e != ErrUnavailable {
		t.Fatal("oversold")
	}
	if _, e = PlanReservation(2, []Reservation{a}, "b", 2, now.Add(2*time.Minute), time.Minute); e != nil {
		t.Fatal("expiry")
	}
}
func TestComplaintSignal(t *testing.T) {
	if ComplaintSignal(5, 4, .05).Review {
		t.Fatal("small sample accusation")
	}
	if !ComplaintSignal(1000, 500, .05).Review {
		t.Fatal("missed review")
	}
}
