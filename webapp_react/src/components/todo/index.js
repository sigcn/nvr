import {useEffect, useState} from "react";
import {Card, Checkbox} from "antd";

export default function Todo({todos = []}) {

  const [todo, setTodo] = useState([...todos])

  useEffect(() => {
    setTodo([...todos])
  }, [todos])

  return <>
    <div className={'absolute float-right right-20 z-10'}>
      <Card title={'Todos'} className={'bg-[#2c88b040]'}>
        {todo.map((t, i) => (
          <div key={i}>
            <Checkbox checked={t.checked}>
              {t.label}
            </Checkbox>
          </div>
        ))}
      </Card>
    </div>
  </>

}
