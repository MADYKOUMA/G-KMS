import React from 'react'
import Image from 'next/image'

interface ProductImageProps {
    src : string,
    alt : string,
    heightClass ? : string,
    widthClass ? : string,
}

const ProductImage: React.FC<ProductImageProps> = ({src, alt, heightClass, widthClass}) => {
  return (
    <div className='avatar'>
        <div className={`mask mask-squircle ${heightClass ?? ""} ${widthClass ?? ""}`.trim()}>
            <Image
                src={src}
                alt={alt}
                quality={100}
                className='object-cover'
                height={50}
                width={50}
            />
        </div>
    </div>
  )
}

export default ProductImage