package errdefs

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

func (err Error) Wrap(e error) Error {
	err.Msg = fmt.Errorf("%s: %w", err.Msg, e).Error()
	return err
}

func (err Error) MarshalTo(w io.Writer) error {
	return json.NewEncoder(w).Encode(err)
}

var (
	ErrCameraNotFound        Error = Error{Code: 1404, Msg: "camera not found"}
	ErrUnsupportedCameraType Error = Error{Code: 1410, Msg: "unsupported camera type"}
	ErrVideoNotFound         Error = Error{Code: 2404, Msg: "video not found"}
)
