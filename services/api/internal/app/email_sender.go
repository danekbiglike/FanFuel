package app

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"html"
	"io"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	"github.com/fanfuel/fanfuel/services/internal/platform/config"
)

type VerificationEmail struct {
	To     string
	Locale string
	Code   string
}

type EmailSender interface {
	SendVerificationCode(context.Context, VerificationEmail) error
}

type smtpEmailSender struct {
	host     string
	port     int
	username string
	password string
	from     string
}

type unavailableEmailSender struct{}

func newEmailSender(cfg config.ServiceConfig) EmailSender {
	if strings.TrimSpace(cfg.SMTPHost) == "" {
		return unavailableEmailSender{}
	}

	return &smtpEmailSender{
		host:     cfg.SMTPHost,
		port:     cfg.SMTPPort,
		username: cfg.SMTPUser,
		password: cfg.SMTPPassword,
		from:     cfg.MailFrom,
	}
}

func (unavailableEmailSender) SendVerificationCode(context.Context, VerificationEmail) error {
	return errors.New("email sender is not configured")
}

func (s *smtpEmailSender) SendVerificationCode(ctx context.Context, message VerificationEmail) error {
	from, err := mail.ParseAddress(s.from)
	if err != nil {
		return fmt.Errorf("parse mail from: %w", err)
	}
	to, err := mail.ParseAddress(message.To)
	if err != nil {
		return fmt.Errorf("parse mail recipient: %w", err)
	}

	subject, textBody, htmlBody := verificationEmailCopy(message.Locale, message.Code)
	boundary := "fanfuel-verification-boundary"
	body := strings.Join([]string{
		"From: " + from.String(),
		"To: " + to.String(),
		"Subject: " + mime.QEncoding.Encode("utf-8", subject),
		"MIME-Version: 1.0",
		"Content-Type: multipart/alternative; boundary=" + boundary,
		"",
		"--" + boundary,
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		textBody,
		"--" + boundary,
		"Content-Type: text/html; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		htmlBody,
		"--" + boundary + "--",
		"",
	}, "\r\n")

	address := net.JoinHostPort(s.host, strconv.Itoa(s.port))
	dialer := net.Dialer{Timeout: 10 * time.Second}
	connection, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return fmt.Errorf("dial smtp: %w", err)
	}
	defer connection.Close()

	client, err := smtp.NewClient(connection, s.host)
	if err != nil {
		return fmt.Errorf("create smtp client: %w", err)
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: s.host, MinVersion: tls.VersionTLS12}); err != nil {
			return fmt.Errorf("start smtp tls: %w", err)
		}
	}
	if s.username != "" {
		if err := client.Auth(smtp.PlainAuth("", s.username, s.password, s.host)); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}
	if err := client.Mail(from.Address); err != nil {
		return fmt.Errorf("smtp mail: %w", err)
	}
	if err := client.Rcpt(to.Address); err != nil {
		return fmt.Errorf("smtp recipient: %w", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := io.WriteString(writer, body); err != nil {
		_ = writer.Close()
		return fmt.Errorf("write smtp body: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close smtp body: %w", err)
	}

	return client.Quit()
}

func verificationEmailCopy(locale string, code string) (string, string, string) {
	if normalizeLocale(locale) == "en" {
		return "Your FanFuel verification code",
			"Your FanFuel verification code is " + code + ". It expires in 10 minutes. If you did not request it, ignore this email.",
			verificationEmailHTML("Verify your email", "Verification code", "The code expires in 10 minutes.", "If you did not request it, you can safely ignore this email.", code)
	}

	return "Код подтверждения FanFuel",
		"Ваш код подтверждения FanFuel: " + code + ". Он действует 10 минут. Если вы не запрашивали код, проигнорируйте письмо.",
		verificationEmailHTML("Подтвердите почту", "Код подтверждения", "Код действует 10 минут.", "Если вы не запрашивали код, просто проигнорируйте письмо.", code)
}

func verificationEmailHTML(heading string, label string, expiry string, ignore string, code string) string {
	return "<!doctype html><html><body>" +
		"<h1>" + html.EscapeString(heading) + "</h1>" +
		"<p>" + html.EscapeString(label) + ":</p>" +
		"<p style=\"font-size:32px;font-weight:700;letter-spacing:6px\">" + html.EscapeString(code) + "</p>" +
		"<p>" + html.EscapeString(expiry) + "</p>" +
		"<p>" + html.EscapeString(ignore) + "</p>" +
		"</body></html>"
}
