package main

import (
	"encoding/json"
	"fmt"
	"io"
)

type Error struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

func (err Error) Error() string {
	return fmt.Sprintf("%s(%d)", err.Msg, err.Code)
}

func (err Error) MarshalTo(w io.Writer) error {
	return json.NewEncoder(w).Encode(err)
}

type Data struct {
	Error
	Data any `json:"data"`
}

func (o Data) MarshalTo(w io.Writer) error {
	return json.NewEncoder(w).Encode(o)
}

var (
	ErrBadRequest            Error = Error{Code: 400, Msg: "bad request"}
	ErrCameraNotFound        Error = Error{Code: 1404, Msg: "camera not found"}
	ErrUnsupportedCameraType Error = Error{Code: 1410, Msg: "unsupported camera type"}
)

func Err(err error) Error {
	if knownErr, ok := err.(Error); ok {
		return knownErr
	}
	return Error{Code: 1, Msg: err.Error()}
}

func Ok(data any) Data {
	return Data{Data: data}
}
