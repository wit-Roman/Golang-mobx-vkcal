package main

import (
	"encoding/json"
	"net/http"
)

func checkStatement(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		secret := r.URL.Query().Get("s")
		if secret != "secret123" {
			http.Error(w, "wrong params", http.StatusBadRequest)
			return
		}

		result := getCheckStatement()
		jsonBytes, err := json.Marshal(result)
		if err != nil {
			http.Error(w, "crash json write", http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write(jsonBytes)
	}
}
