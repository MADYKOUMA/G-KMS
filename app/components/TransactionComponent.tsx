import { Transactions } from "@/type";
import React from "react";
import ProductImage from "./ProductImage";

const TransactionComponent = ({ tx }: { tx: Transactions }) => {
  const formatAmount = (value: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

  const formattedData = new Date(tx.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="p-3 sm:p-4 border-2 border-base-200 rounded-3xl flex gap-3 sm:gap-4 items-start sm:items-center w-full">
      <div className="shrink-0">
        {tx.imageUrl && (
          <ProductImage
            src={tx.imageUrl}
            alt={tx.imageUrl}
            heightClass="h-10 sm:h-12"
            widthClass="w-10 sm:w-12"
          />
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <p className="font-semibold text-sm sm:text-base truncate">{tx.productName}</p>
          <div className="badge badge-soft badge-warning badge-sm mt-1 sm:mt-2 max-w-full truncate">
            {tx.categoryName}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
          <div className="font-semibold text-sm sm:text-base whitespace-nowrap">
            {formatAmount(tx.price * tx.quantity)} CFA
          </div>

          <div className="flex items-end flex-col text-right whitespace-nowrap">
            {tx.type == "IN" ? (
              <span className="text-success font-bold text-base sm:text-xl capitalize">
                +{tx.quantity} {tx.unit}
              </span>
            ) : (
              <span className="text-error font-bold text-base sm:text-xl capitalize">
                -{tx.quantity} {tx.unit}
              </span>
            )}
            <div className="text-xs text-base-content/70">{formattedData}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionComponent;
