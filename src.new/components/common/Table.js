import React from "react";
export default function Table({ className='', children, ...props }){
  return <table className={className} {...props}>{children}</table>;
}
