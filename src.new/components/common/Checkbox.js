import React from "react";
export default function Checkbox({ className='', ...props }){
  return <input type="checkbox" className={className} {...props} />;
}
