package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	base64 "encoding/base64"
	"io"
	"strconv"
	"strings"
)

type ITokenStore struct {
	group_id  int64
	viewer_id int64
	rights    int64
	date      int64
}

var tokenStore = make(map[string]ITokenStore)

func createToken(group_id int64, viewer_id int64, rights int64) string {
	date := currentDateNow()

	message := strconv.FormatInt(group_id, 10) + " " + strconv.FormatInt(viewer_id, 10) + " " + strconv.FormatInt(date, 10) + " " + strconv.FormatInt(int64(rights), 10)

	block, err := aes.NewCipher([]byte(CIPHER_KEY))
	if err != nil {
		return ""
	}
	b := base64.StdEncoding.EncodeToString([]byte(message))
	ciphertext := make([]byte, aes.BlockSize+len(b))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return ""
	}
	cfb := cipher.NewCFBEncrypter(block, iv)
	cfb.XORKeyStream(ciphertext[aes.BlockSize:], []byte(b))

	return base64.StdEncoding.EncodeToString(ciphertext)
}

func readToken(token string) (bool, string) {
	tokenText, err := base64.StdEncoding.DecodeString(token)
	if err != nil || len(tokenText) < aes.BlockSize {
		return false, ""
	}
	block, err := aes.NewCipher([]byte(CIPHER_KEY))
	if err != nil {
		return false, ""
	}
	iv := tokenText[:aes.BlockSize]
	tokenText = tokenText[aes.BlockSize:]
	cfb := cipher.NewCFBDecrypter(block, iv)
	cfb.XORKeyStream(tokenText, tokenText)
	data, err := base64.StdEncoding.DecodeString(string(tokenText))
	if err != nil {
		return false, ""
	}

	message := string(data[:])
	return true, message
}

func validateToken(token string, group_id int64, viewer_id int64, rights int64) (bool, string) {
	//Функция зависит от опции AccessMember
	if rights == -1 {
		if val, ok := AccessMemberGroups[group_id]; ok && val {
			rights = 1
		} else {
			rights = 0
		}
	}

	value, ok := tokenStore[token]
	if ok {
		if value.group_id == group_id &&
			value.viewer_id == viewer_id &&
			value.rights >= rights {
			return true, ""
		} else {
			return false, ""
		}
	}

	success, message := readToken(token)

	if !success || !strings.Contains(message, " ") {
		return false, ""
	}

	elems := strings.Split(message, " ")
	if len(elems) != 4 {
		return false, ""
	}

	extract_group_id, err := strconv.ParseInt(elems[0], 10, 64)
	if err != nil || extract_group_id != group_id {
		return false, ""
	}

	extract_viewer_id, err := strconv.ParseInt(elems[1], 10, 64)
	if err != nil || extract_viewer_id != viewer_id {
		return false, ""
	}

	date := currentDateNow()
	extract_date, err := strconv.ParseInt(elems[2], 10, 64)
	if err != nil || date-extract_date > tokenTimeLive {
		return false, ""
	}

	extract_rights, err := strconv.ParseInt(elems[3], 10, 64)
	if err != nil || rights > extract_rights {
		return false, ""
	}

	if date-extract_date > (tokenTimeLive/2) {
		updatedToken := createToken(group_id, viewer_id, extract_rights)
		return true, updatedToken
	}

	if ok := writeTokenStore(token, group_id, viewer_id, extract_rights); ok {
		return true, ""
	} else {
		return false, ""
	}
}

func clearToken(token string) (bool, string) {
	if !strings.Contains(token, "Bearer ") {
		return false, ""
	}

	result := strings.ReplaceAll(token, "Bearer ", "")
	return true, result
}

func autoStoreClear() {
	currentDate := currentDateNow()
	for key, token := range tokenStore {
		if currentDate-token.date > (tokenTimeLive/4) {
			delete(tokenStore, key)
		}
	}
}

func writeTokenStore(token string, group_id int64, viewer_id int64, rights int64) bool {
	if len(tokenStore) > 1024 {
		return false
	}
	date := currentDateNow()
	tokenStore[token] = ITokenStore{group_id, viewer_id, rights, date}
	return true
}
