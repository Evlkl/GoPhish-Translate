package api

import (
	"net/http"

	"github.com/gophish/gophish/auth"
	ctx "github.com/gophish/gophish/context"
	"github.com/gophish/gophish/models"
)

// Reset (/api/reset) resets the currently authenticated user's API key
func (as *Server) Reset(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == "POST":
		u := ctx.Get(r, "user").(models.User)
		u.ApiKey = auth.GenerateSecureKey(auth.APIKeyLength)
		err := models.PutUser(&u)
		if err != nil {
			http.Error(w, "API Açarının tənzimlənməsi xətası", http.StatusInternalServerError)
		} else {
			JSONResponse(w, models.Response{Success: true, Message: "API Key uğurla sıfırlandı!", Data: u.ApiKey}, http.StatusOK)
		}
	}
}
