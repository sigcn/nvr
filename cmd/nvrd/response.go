package main

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/sigcn/nvr/errdefs"
)

type Data struct {
	errdefs.Error
	Data any `json:"data"`
}

func (o Data) MarshalTo(w io.Writer) error {
	return json.NewEncoder(w).Encode(o)
}

var (
	ErrBadRequest     errdefs.Error = errdefs.Error{Code: 400, Msg: "bad request"}
	ErrNotONVIFDevice errdefs.Error = errdefs.Error{Code: 10000, Msg: "not onvif device"}
	ErrNoMoveFeature  errdefs.Error = errdefs.Error{Code: 10001, Msg: "no move feature"}
)

func Err(err error) errdefs.Error {
	if knownErr, ok := err.(errdefs.Error); ok {
		return knownErr
	}
	return errdefs.Error{Code: 1, Msg: err.Error()}
}

func Ok(data any) Data {
	return Data{Data: data}
}

func ErrForbidden(err error) errdefs.Error {
	return errdefs.Error{Code: 4030, Msg: fmt.Errorf("forbidden: %w", err).Error()}
}
