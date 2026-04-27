import { Transactions } from '@/type';
import React, { useEffect, useState } from 'react'
import { getTransactions } from './actions';
import EmptyState from './EmptyState';
import TransactionComponent from './TransactionComponent';

const RecentTransactions = ({ email }: { email: string }) => {
    const [transactions, setTransactions] = useState<Transactions[]>([]);


    const fetchData = async () => {
        try {
          if (email) {
            const txs = await getTransactions(email, 10);
            if (txs) {
              setTransactions(txs);
            }
          }
        } catch (error) {
          console.error(error);
        }
      };
    
      useEffect(() => {
        if (email) fetchData();
      }, [email]);
  return (
    <div className='w-full border-2 border-base-200 mt-4 p-3 sm:p-4 rounded-3xl'>
         {transactions.length == 0 ? (
          <EmptyState
            message="Aucune transaction pour le moment"
            IconComponent="CaptionsOff"
          />
        ) : (
          <div className="">
            <h2 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4'>10 dernières transactions</h2>
            <div className='space-y-2 sm:space-y-4'>
                {transactions.map((tx) => (
              <TransactionComponent key={tx.id} tx={tx} />
            ))}
            </div>
          </div>
        )}
    </div>
  )
}

export default RecentTransactions