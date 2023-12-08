package api

import (
	"encoding/json"
	"net/http"
	"net/mail"

	ctx "github.com/gophish/gophish/context"
	log "github.com/gophish/gophish/logger"
	"github.com/gophish/gophish/models"
	"github.com/jinzhu/gorm"
	"github.com/sirupsen/logrus"
)

// SendTestEmail sends a test email using the template name
// and Target given.
func (as *Server) SendTestEmail(w http.ResponseWriter, r *http.Request) {
	s := &models.EmailRequest{
		ErrorChan: make(chan error),
		UserId:    ctx.Get(r, "user_id").(int64),
	}
	if r.Method != "POST" {
		JSONResponse(w, models.Response{Success: false, Message: "Bu metoda icazə verilmir"}, http.StatusBadRequest)
		return
	}
	err := json.NewDecoder(r.Body).Decode(s)
	if err != nil {
		JSONResponse(w, models.Response{Success: false, Message: "JSON Sorğusunun deşifrə edilməsi xətası"}, http.StatusBadRequest)
		return
	}

	storeRequest := false

	// If a Template is not specified use a default
	if s.Template.Name == "" {
		//default message body
		text := "İşləyir!\n\nBu, proqramın işlədiyini bildirən bir e-poçtdur\nkonfiqurasiya uğurlu oldu.\n" +
			"Detallar:\n\nKim Göndərdi: {{.From}}\n\nKimə göndərdin: \n" +
			"{{if .FirstName}} Ad: {{.FirstName}}\n{{end}}" +
			"{{if .LastName}} Soyad: {{.LastName}}\n{{end}}" +
			"{{if .Position}} Vəzifə: {{.Position}}\n{{end}}" +
			"\nÖyrən amma phishing etmə!"
		t := models.Template{
			Subject: "Gophish-dən standart e-poçt",
			Text:    text,
		}
		s.Template = t
	} else {
		// Get the Template requested by name
		s.Template, err = models.GetTemplateByName(s.Template.Name, s.UserId)
		if err == gorm.ErrRecordNotFound {
			log.WithFields(logrus.Fields{
				"template": s.Template.Name,
			}).Error("Şablon mövcud deyil")
			JSONResponse(w, models.Response{Success: false, Message: models.ErrTemplateNotFound.Error()}, http.StatusBadRequest)
			return
		} else if err != nil {
			log.Error(err)
			JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusBadRequest)
			return
		}
		s.TemplateId = s.Template.Id
		// We'll only save the test request to the database if there is a
		// user-specified template to use.
		storeRequest = true
	}

	if s.Page.Name != "" {
		s.Page, err = models.GetPageByName(s.Page.Name, s.UserId)
		if err == gorm.ErrRecordNotFound {
			log.WithFields(logrus.Fields{
				"page": s.Page.Name,
			}).Error("Səhifə mövcud deyil")
			JSONResponse(w, models.Response{Success: false, Message: models.ErrPageNotFound.Error()}, http.StatusBadRequest)
			return
		} else if err != nil {
			log.Error(err)
			JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusBadRequest)
			return
		}
		s.PageId = s.Page.Id
	}

	// If a complete sending profile is provided use it
	if err := s.SMTP.Validate(); err != nil {
		// Otherwise get the SMTP requested by name
		smtp, lookupErr := models.GetSMTPByName(s.SMTP.Name, s.UserId)
		// If the Sending Profile doesn't exist, let's err on the side
		// of caution and assume that the validation failure was more important.
		if lookupErr != nil {
			log.Error(err)
			JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusBadRequest)
			return
		}
		s.SMTP = smtp
	}

	_, err = mail.ParseAddress(s.Template.EnvelopeSender)
	if err != nil {
		_, err = mail.ParseAddress(s.SMTP.FromAddress)
		if err != nil {
			JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusInternalServerError)
			return
		} else {
			s.FromAddress = s.SMTP.FromAddress
		}
	} else {
		s.FromAddress = s.Template.EnvelopeSender
	}

	// Validate the given request
	if err = s.Validate(); err != nil {
		JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusBadRequest)
		return
	}

	// Store the request if this wasn't the default template
	if storeRequest {
		err = models.PostEmailRequest(s)
		if err != nil {
			log.Error(err)
			JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusInternalServerError)
			return
		}
	}
	// Send the test email
	err = as.worker.SendTestEmail(s)
	if err != nil {
		log.Error(err)
		JSONResponse(w, models.Response{Success: false, Message: err.Error()}, http.StatusInternalServerError)
		return
	}
	JSONResponse(w, models.Response{Success: true, Message: "E-Poçt Göndərildi"}, http.StatusOK)
}
