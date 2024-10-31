import Todo from "@/components/todo";

export default function Storage() {

  const todos = [
    {label: '存储源管理', checked: false},
    {label: '支持oss', checked: false},
  ]

  return <>
    Storage
    <Todo todos={todos}/>
  </>

}
