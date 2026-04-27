import { ProductOverviewStats } from '@/type'
import React, { useEffect, useState } from 'react'
import { getProductOverviewStats } from './actions'
import { Box, DollarSign, ShoppingCart, Tag } from 'lucide-react'

const ProductOverview = ({email} : {email:string}) => {
    const [stats, setStats] = useState<ProductOverviewStats | null>(null)

     const fetchStats = async () =>{
            try {
                if(email){
                    const result = await getProductOverviewStats(email)
                    if(result){
                        setStats(result)
                    }
                }
            } catch (error) {
                console.error(error)
            }
        }

        const formatAmount = (value: number): string =>
            new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
    
        useEffect(() =>{
            if(email)
                fetchStats()
        }, [email])
  return (
    <div>
        {stats ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                
                <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Produits en stock</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value text-2xl md:text-3xl truncate'>{stats.totalProducts}</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <Box className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

                 <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Nombre de catégories</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value text-2xl md:text-3xl truncate'>{stats.totalCategories}</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <Tag className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

                 <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Valeur total du stock</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value md:text-xs truncate'>{formatAmount(stats.stockValue)} CFA</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <DollarSign className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

                 <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Valeur total Entrant</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value md:text-xs truncate'>{formatAmount(stats.totalEntrant)} CFA</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <DollarSign className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

                 <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Valeur total Vendu</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value md:text-xs truncate'>{formatAmount(stats.totalVendu)} CFA</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <DollarSign className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

                 <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Bénéfice</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value md:text-xs truncate'>{formatAmount(stats.benefice)} CFA</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <DollarSign className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

                 <div className='border-2 p-4 border-base-200 rounded-3xl min-w-0 overflow-hidden'>
                    <p className='stat-title'>Nombre de transactions</p>
                    <div className='flex justify-between items-center gap-3 min-w-0'>
                        <div className='stat-value text-2xl md:text-3xl truncate'>{stats.totalTransactions}</div>
                        <div className='bg-primary/25 p-3 rounded-full'>
                            <ShoppingCart className="w-5 h-5 text-primary text-3xl"/>
                        </div>
                    </div>
                </div>

            </div>
        ) : (
            <div>
                <span className='loading loading-spinner loading-xl'></span>
            </div>
        )}
    </div>
  )
}

export default ProductOverview