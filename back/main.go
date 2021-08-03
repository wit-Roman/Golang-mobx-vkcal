package main

import (
	"log"
	"net/http"
	"runtime"
)

func init() {
	dbConnect()
	dbCreateTables()
	dbStartWidgetWorker()
	go autoTimeTicker()
}

func main() {
	runtime.GOMAXPROCS(1)

	defer DB.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("/", home)
	mux.HandleFunc("/vksession", vkSession)
	mux.HandleFunc("/check", checkStatement)
	mux.HandleFunc("/change", changeDate)
	mux.HandleFunc("/users", usersData)
	mux.HandleFunc("/user", userData)
	mux.HandleFunc("/dates", getDates)
	mux.HandleFunc("/listen", listenHandler)
	mux.HandleFunc("/pinned", pinnedDate)
	mux.HandleFunc("/groups", groupsUser)
	mux.HandleFunc("/setting", getSetting)
	mux.HandleFunc("/savesetting", saveSetting)
	mux.HandleFunc("/widget", widgetEnable)
	mux.HandleFunc("/countdates", getCountSelectedDates)

	fileServer := http.FileServer(http.Dir("./static/"))
	mux.Handle("/static/", http.StripPrefix("/static", fileServer))

	log.Println("Запуск сервера " + port)
	err := http.ListenAndServe(port, mux)

	log.Fatal(err)
}
