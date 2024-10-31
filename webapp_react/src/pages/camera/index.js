import Todo from "@/components/todo";

export default function Camera() {


  const todos = [
    {label: '监控列表', checked: false},
    {label: '支持监控批量增加(支持按网段)', checked: false},
    {label: '支持通道切换(主通道占用较大)', checked: false},
    {label: '切换预览数量', checked: false},
    {label: '支持动态布局', checked: false},
  ]

  return <>
    Camera
    <Todo todos={todos}/>
  </>

}
