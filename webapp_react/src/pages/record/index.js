import Todo from "@/components/todo";

export default function Record() {

  const todos = [
    {label: '录制管理', checked: false},
    {label: '切片大小(1/5/30分钟)', checked: false},
    {label: '回看', checked: false},
  ]

  return <>
    Record
    <Todo todos={todos}/>

  </>

}
