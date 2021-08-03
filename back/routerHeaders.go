package main

import (
	"net/http"
	"strconv"
)

func addHeaders(w *http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	acceptedUrl := "https://vkapp.apps-web.xyz"
	if origin == "https://localhost:10888" ||
		origin == "https://prod-app7121023-351714efbd47.pages-ac.vk-apps.com" ||
		origin == "https://stage-app7121023-351714efbd47.pages.vk-apps.com" {
		acceptedUrl = origin
	}

	(*w).Header().Set("Access-Control-Allow-Origin", acceptedUrl)
	(*w).Header().Set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control, X-Accel-Buffering, Authorization")
	(*w).Header().Set("Access-Control-Expose-Headers", "Authorization")
	(*w).Header().Set("Content-Type", "application/json")
}

func addHeadersSSE(w *http.ResponseWriter) {
	(*w).Header().Set("Connection", "keep-alive")
	(*w).Header().Set("Content-Type", "text/event-stream;charset=utf-8")
	(*w).Header().Set("Cache-Control", "no-cache, no-transform")
	(*w).Header().Set("X-Accel-Buffering", "no")
}

func addTokenHeader(w *http.ResponseWriter, token string) {
	(*w).Header().Set("Authorization", token)
}

func validateTokenHeader(w *http.ResponseWriter, r *http.Request, overRights int64) (bool, int64, int64) {
	query := r.URL.Query()

	group_id, err := strconv.ParseInt(query.Get("g"), 10, 64)
	if err != nil {
		return false, 0, 0
	}

	viewer_id, err := strconv.ParseInt(query.Get("v"), 10, 64)
	if err != nil {
		return false, 0, 0
	}

	var token string
	headerAuthFull := r.Header.Get("Authorization")
	if len(headerAuthFull) < 32 {
		token = query.Get("t")
		if len(token) < 32 {
			return false, 0, 0
		}
	} else {
		success, headerAuth := clearToken(headerAuthFull)
		if !success {
			return false, 0, 0
		}
		token = headerAuth
	}

	success, newToken := validateToken(token, group_id, viewer_id, overRights)
	if !success {
		return false, 0, 0
	}

	if len(newToken) > 0 {
		addTokenHeader(w, newToken)
	}

	return true, group_id, viewer_id
}
