package camera

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	"github.com/use-go/onvif"
	"github.com/use-go/onvif/device"
	"github.com/use-go/onvif/media"
	"github.com/use-go/onvif/ptz"
	sdkdevice "github.com/use-go/onvif/sdk/device"
	sdkmedia "github.com/use-go/onvif/sdk/media"
	xsdonvif "github.com/use-go/onvif/xsd/onvif"
)

type Camera interface {
	ID() string
	Type() string
	Remark() string
	StreamURL() (string, error)
	Meta() Meta
}

type Meta struct {
	Manufacturer    string `json:"manufacturer"`
	Model           string `json:"model"`
	FirmwareVersion string `json:"firmware_version"`
	SerialNumber    string `json:"serial_number"`
}

var (
	_ Camera = (*ONVIFCamera)(nil)
)

type ONVIFCamera struct {
	CID      string `json:"id"`
	CType    string `json:"type"`
	Desc     string `json:"remark"`
	Metadata Meta   `json:"meta"`

	Xaddr     string `json:"addr"`
	Xusername string `json:"username"`
	Xpassword string `json:"password"`

	device   *onvif.Device
	profiles []xsdonvif.Profile
}

func NewONVIFCamera(addr, username, password string) (*ONVIFCamera, error) {
	cam := ONVIFCamera{
		CType:     "onvif",
		Xaddr:     addr,
		Xusername: username,
		Xpassword: password,
	}
	if err := cam.init(); err != nil {
		return nil, err
	}
	return &cam, nil
}

func (cam *ONVIFCamera) init() error {
	d, err := onvif.NewDevice(onvif.DeviceParams{Xaddr: cam.Xaddr, Username: cam.Xusername, Password: cam.Xpassword})
	if err != nil {
		return fmt.Errorf("onvif: create device: %w", err)
	}
	cam.device = d

	r, err := sdkdevice.Call_GetDeviceInformation(context.Background(), d, device.GetDeviceInformation{})
	if err != nil {
		return fmt.Errorf("onvif: get device info: %w", err)
	}

	cam.CID = fmt.Sprintf("%s_%s", r.SerialNumber, r.HardwareId)
	cam.Metadata = Meta{
		Manufacturer:    r.Manufacturer,
		Model:           r.Model,
		FirmwareVersion: r.FirmwareVersion,
		SerialNumber:    r.SerialNumber,
	}

	r1, err := sdkmedia.Call_GetProfiles(context.Background(), d, media.GetProfiles{})
	if err != nil {
		return fmt.Errorf("onvif: get profiles: %w", err)
	}
	if r1.Profiles == nil {
		return errors.New("invalid username/password")
	}
	cam.profiles = r1.Profiles
	return nil
}

func (cam *ONVIFCamera) ID() string {
	return cam.CID
}

func (cam *ONVIFCamera) Type() string {
	return cam.CType
}

func (cam *ONVIFCamera) Remark() string {
	return cam.Desc
}

func (cam *ONVIFCamera) StreamURL() (string, error) {
	if cam.profiles == nil {
		return "", errors.New("offline")
	}
	r, err := sdkmedia.Call_GetStreamUri(context.Background(), cam.device, media.GetStreamUri{ProfileToken: cam.profiles[0].Token})
	if err != nil {
		return "", fmt.Errorf("onvif: get stream uri: %w", err)
	}
	streamUrl, err := url.Parse(string(r.MediaUri.Uri))
	if err != nil {
		return "", fmt.Errorf("invalid stream uri from onvif: %w", err)
	}
	streamUrl.User = url.UserPassword(cam.Xusername, url.QueryEscape(cam.Xpassword))
	return streamUrl.String(), nil
}

func (cam *ONVIFCamera) Meta() Meta {
	return cam.Metadata
}

func (cam *ONVIFCamera) Move(x, y float64) error {
	if cam.profiles == nil {
		return errors.New("offline")
	}

	relativeMoveRequest := ptz.RelativeMove{
		ProfileToken: cam.profiles[0].Token,
		Translation: xsdonvif.PTZVector{
			PanTilt: xsdonvif.Vector2D{X: x, Y: y},
		},
	}

	_, err := cam.device.CallMethod(relativeMoveRequest)
	return err
}
