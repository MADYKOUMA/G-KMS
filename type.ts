import { Product as PrismaProduct } from "@prisma/client";
import { Transactions as PrismaTransaction } from "@prisma/client";

export interface Product extends PrismaProduct {
    categoryName: string;
}

export interface FormDataType {
    id?: string;
    name: string;
    description: string;
    price: number;
    purchasePrice?: number;
    quantity?: number;
    categoryId?: string;
    unit?: string;
    categoryName?: string;
    imageUrl?: string;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    unit: string;
    imageUrl: string;
    name: string;
    availableQuantity: number;
    price?: number;
    purchasePrice?: number;
}

export interface Transactions extends PrismaTransaction{
    categoryName: string;
    productName: string;
    imageUrl?: string;
    price: number;
    unit: string
}

export interface ProductOverviewStats {
    totalProducts: number;
    totalCategories: number;
    totalTransactions: number;
    stockValue: number;
    totalVendu: number;
    totalEntrant:number;
    benefice:number;
}

export interface ChartData {
    name: string;
    value: number;
}

export interface StockSummary{
    inSctockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    criticalProducts: Product[];
}