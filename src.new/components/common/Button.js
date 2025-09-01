import React from "react";
export default function Button({ as:Tag='button', className='', ...props }){
  return <Tag className={className} {...props} />;
}
