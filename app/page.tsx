"use client"
import { useUser } from "@clerk/nextjs";
import Wrapper from "./components/Wrapper";
import ProductOverview from "./components/ProductOverview";
import CategoryChart from "./components/CategoryChart";
import RecentTransactions from "./components/RecentTransactions";
import StockSummaryTable from "./components/StockSummaryTable";

export default function Home() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;

  return (
    <Wrapper>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          <ProductOverview email={email} />
          <CategoryChart email={email} />
          <RecentTransactions email={email} />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <StockSummaryTable email={email} />
        </div>
      </div>
    </Wrapper>
  );
}
