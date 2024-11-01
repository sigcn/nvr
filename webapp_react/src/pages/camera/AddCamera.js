import {Input, Select} from "antd";
import React from "react";

export default function AddCamera() {


  const [type, setType] = React.useState('onvif')
  const [addr, setAddr] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')


  return (
    <div className={'w-fit flex flex-col min-w-[300px] space-y-4'}>
      <Select value={type} className={'w-fit'} placeholder={'onvif'}>
        <Select.Option title={'onvif'} value={'onvif'} />
      </Select>

      <Input value={addr} placeholder={'IP Address'}/>
      <Input value={username} placeholder={'Username'}/>
      <Input value={password} placeholder={'Password'}/>

    </div>
  );

}
