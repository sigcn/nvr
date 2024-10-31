import Todo from '@/components/todo'

export default function User() {

  const todos = [
    {label: '用户列表', checked: false},
    {label: '修改密码', checked: false},
    {label: '授权设备', checked: false},
  ]
  return <>
    User
    <Todo todos={todos}/>
  </>

}
