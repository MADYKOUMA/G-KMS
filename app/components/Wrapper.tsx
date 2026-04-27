import React from "react";
import Navbar from "./Navbar";

type WrapperProps = {
    children : React.ReactNode
}

const Wrapper = ({children} : WrapperProps) =>{
    return (
        <div>
            <Navbar/>
            <div className="px-5 md:px-[10%] pt-24 sm:pt-28 mb-10">
               {children} 
            </div>
        </div>
    )
}

export default Wrapper