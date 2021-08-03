package main

import (
	"database/sql"

	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// DB is a global variable to hold db connection
var DB *sql.DB

func dbConnect() {
	db, err := sql.Open("mysql", mysqlOpen)
	if err != nil {
		log.Fatal(err)
	}

	//defer db.Close()
	//https://habr.com/ru/company/ispring/blog/560032/
	db.SetMaxOpenConns(16)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(time.Minute)

	DB = db
}

func dbCreateTables() {
	SQLquery := `CREATE TABLE IF NOT EXISTS sessions ( i INT PRIMARY KEY AUTO_INCREMENT, viewer_id INT, group_id INT, first_name VARCHAR(80), last_name VARCHAR(80), photo_100 VARCHAR(200), viewer_type VARCHAR(16), rights SMALLINT, timezone SMALLINT, creating INT, CONSTRAINT uniq_viewer_group UNIQUE ( viewer_id, group_id ) ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	CREATE TABLE IF NOT EXISTS selected_dates ( i INT PRIMARY KEY AUTO_INCREMENT, group_id INT, viewer_id INT, date INT, creating INT, isPinned SMALLINT, CONSTRAINT uniq_viewer_group_date UNIQUE ( group_id, viewer_id, date ) ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	CREATE TABLE IF NOT EXISTS settings_allowed ( i INT PRIMARY KEY AUTO_INCREMENT, group_id INT, option_name VARCHAR(32), option_value VARCHAR(96), creating INT ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	CREATE TABLE IF NOT EXISTS settings_blockedDays ( i INT PRIMARY KEY AUTO_INCREMENT, group_id INT, date INT, creating INT ) ENGINE=InnoDB DEFAULT CHARSET=utf8; 
	CREATE TABLE IF NOT EXISTS settings_specialDays ( i INT PRIMARY KEY AUTO_INCREMENT, group_id INT, date INT, description VARCHAR(80) NOT NULL DEFAULT '', color VARCHAR(32) NOT NULL DEFAULT '', creating INT, CONSTRAINT uniq_group_date UNIQUE ( group_id, date ) ) ENGINE=InnoDB DEFAULT CHARSET=utf8`

	_, err := DB.Exec(SQLquery)
	if err != nil {
		log.Fatal(err)
	}
}

type Irow_widget struct {
	group_id     int64
	option_name  string
	option_value string
}
type Irow_widget_values struct {
	widgetEnable bool
	widgetToken  string
}

func dbStartWidgetWorker() {
	const selectQuery = "SELECT group_id, option_name, option_value FROM `settings_allowed` WHERE (option_name='widgetEnable' AND option_value='1') OR (option_name='widgetToken' AND LENGTH(option_value)=85); "
	selectedRows, err := DB.Query(selectQuery)
	if err != nil {
		return
	}
	defer selectedRows.Close()

	var widgets = make(map[int64]Irow_widget_values)
	for selectedRows.Next() {
		var row Irow_widget
		err := selectedRows.Scan(&row.group_id, &row.option_name, &row.option_value)
		if err != nil {
			return
		}

		if row.option_value == "1" {
			widgets[row.group_id] = Irow_widget_values{widgetEnable: true, widgetToken: widgets[row.group_id].widgetToken}
		}
		if len(row.option_value) == 85 {
			widgets[row.group_id] = Irow_widget_values{widgetEnable: widgets[row.group_id].widgetEnable, widgetToken: row.option_value}
		}
	}

	for date, val := range widgets {
		if val.widgetEnable && len(val.widgetToken) == 85 {
			activeWidgetStore[date] = val.widgetToken
		}
	}
}

func autoTimeTicker() {
	i := 0
	ticker := time.NewTicker(time.Minute)
	for range ticker.C {
		autoStoreClear()
		if i == 10 {
			autoWidgetUpdate()
			i = 0
		}
		i++
	}
}
