package main

import (
	"html/template"
	"log"
	"net/http"
)


func home(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	ts := template.Must(template.ParseFiles("./static/index.tmpl"))
	
	err := ts.Execute(w, nil)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, "Internal Server Error", 500)
	}
}