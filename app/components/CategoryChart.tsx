import { ChartData } from "@/type";
import React, { useEffect, useState } from "react";
import { getProductCategoryDistribution } from "./actions";
import {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
  BarChart,
  LabelList,
  Cell,
} from "recharts";
import EmptyState from "./EmptyState";

const CategoryChart = ({ email }: { email: string }) => {
  const [data, setData] = useState<ChartData[]>([]);

  const COLORS = {
    default: "#F1D2BF"
  }
  const fetchStats = async () => {
    try {
      if (email) {
        const data = await getProductCategoryDistribution(email);
        if (data) {
          setData(data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (email) fetchStats();
  }, [email]);

  const renderChart = (opts?: { height?: number; fontSize?: number; barSize?: number; labelFontSize?: number }) => (
    <ResponsiveContainer width="100%" height={opts?.height ?? 350}>
      <BarChart
        data={data}
        margin={{
          top: 0,
          right: 0,
          left: 0,
          bottom: 5,
        }}
        barCategoryGap="10"
      >
        <XAxis 
        dataKey="name" 
        axisLine={false}
        tickLine={false}
        tick={
          {
            fontSize: opts?.fontSize ?? 15,
            fill: "#793205",
            fontWeight: "bold"
          }
        }
        />
        <YAxis hide />
        {/* <Tooltip />
        <Legend /> */}
        <Bar
          dataKey="value"
          radius={[8, 8, 0, 0]}
          barSize={opts?.barSize}
        >
          <LabelList
            fill="#793205"
            dataKey="value"
            position="inside"
            style={{fontSize: `${opts?.labelFontSize ?? 20}px`, fontWeight: "bold"}}
          />
          {data.map((entry, index) =>(
            <Cell key={`cell-${index}`} fill={COLORS.default} cursor="default"/>
          ))}
          </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (data.length == 0) {
    return (
      <div className="w-full border-2 border-base-200 mt-4 p-4 rounded-3xl">
        <h2>
          <EmptyState
            message="Aucune catégorie pour le moment"
            IconComponent="Group"
          />
        </h2>
      </div>
    );
  }

  return (
     <div className="w-full border-2 border-base-200 mt-4 p-4 rounded-3xl">
          <h2 className='text-xl font-bold mb-4'>5 catégories avec le plus de produits</h2>
          <div className="block md:hidden">
            {renderChart({ height: 260, fontSize: 12, barSize: 48, labelFontSize: 14 })}
          </div>
          <div className="hidden md:block">
            {renderChart({ height: 350, fontSize: 15, barSize: 90, labelFontSize: 18 })}
          </div>
      </div>
  );
};

export default CategoryChart;
