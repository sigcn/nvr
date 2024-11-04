import {Input, Radio, Select} from "antd";
import React, {forwardRef, useImperativeHandle} from "react";

const AddCamera = forwardRef(function AddCamera(props, ref) {

    const [multi, setMulti] = React.useState(true)
    const [type, setType] = React.useState('onvif')
    const [addr, setAddr] = React.useState('')
    const [addrStart, setAddrStart] = React.useState('10.10.2.4')
    const [addrEnd, setAddrEnd] = React.useState('10.10.2.100')
    const [username, setUsername] = React.useState('admin')
    const [password, setPassword] = React.useState('123@sulei')

    useImperativeHandle(ref, () => {
      return {
        data: {
          type, addr, username, password, multi, addrStart, addrEnd
        },
      };
    }, [addr, addrEnd, addrStart, multi, password, type, username]);


    return (
      <div className={'w-full flex flex-col min-w-[300px] space-y-4'}>
        <Select value={type} className={'w-full'} placeholder={'onvif'} onChange={v => setType(v)}>
          <Select.Option title={'onvif'} value={'onvif'}>onvif</Select.Option>
        </Select>

        <Radio.Group
          options={[
            {label: 'Single IP', value: false},
            {label: 'IP Range', value: true},
          ]}
          onChange={v => setMulti(v.target.value)}
          value={multi}
          optionType="button"
          buttonStyle="solid"
        />

        <div>
          {!multi && <Input value={addr} placeholder={'IP Address'} onChange={v => setAddr(v.target.value)}/>}
          {multi && (<div className={'flex justify-around'}>
            <Input className={'w-1/2 mr-1'} value={addrStart} placeholder={'10.0.0.x'} onChange={v => setAddrStart(v.target.value)}/>
            <Input className={'w-1/2 ml-1'} value={addrEnd} placeholder={'10.0.0.y'} onChange={v => setAddrEnd(v.target.value)}/>
          </div>)}
        </div>

        <Input value={username} placeholder={'Username'} onChange={v => setUsername(v.target.value)}/>

        <Input value={password} placeholder={'Password'} onChange={v => setPassword(v.target.value)}/>

      </div>
    )
  }
)

export default AddCamera
