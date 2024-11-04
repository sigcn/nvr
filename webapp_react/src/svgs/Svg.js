import Image from "next/image";

/**
 * 给svg包装一下, 使用nextjs的image组件,属性完全透传.
 */
export default function Svg(props) {
  return <Image alt={''} {...props}/>
}
