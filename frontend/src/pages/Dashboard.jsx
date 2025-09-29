import React, { useEffect, useState } from "react";
import API from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    lowstock: 0,
    expirySoon: 0,
    todaySale: 0,
    weeklySale: 0,
    monthlySale: 0,
    totalSale: 0,
    weekChart: [],
  });

  // Helper function: Weekly sales chart calculation
  const getWeeklySalesData = (sales) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Initialize week data with 0
    const weekData = days.map((d) => ({ name: d, sale: 0 }));

    sales.forEach((s) => {
      const saleDate = new Date(s.date);
      if (saleDate >= startOfWeek && saleDate <= today) {
        const dayIndex = saleDate.getDay();
        weekData[dayIndex].sale += Number(s.total_amount || 0);
      }
    });

    return weekData;
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        const medsRes = await API.get("/medicines");
        const salesRes = await API.get("/sales");

        const medicines = medsRes.data;
        const sales = salesRes.data;

        // Medicine Stats
        const totalProducts = medicines.length;
        const lowStock = medicines.filter((m) => m.quantity <= 5).length;
        const expirySoon = medicines.filter((m) => {
          const diffDays =
            (new Date(m.expiry_date) - new Date()) / (1000 * 3600 * 24);
          return diffDays <= 30;
        }).length;

        // Sales Stats
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const endOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          1
        );
        endOfMonth.setHours(0, 0, 0, 0);

        const todaySale = sales
          .filter((s) => {
            const saleDate = new Date(s.date);
            return saleDate >= startOfToday && saleDate < endOfToday;
          })
          .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

        const weeklySale = sales
          .filter((s) => {
            const saleDate = new Date(s.date);
            return saleDate >= startOfWeek && saleDate < endOfWeek;
          })
          .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

        const monthlySale = sales
          .filter((s) => {
            const saleDate = new Date(s.date);
            return saleDate >= startOfMonth && saleDate < endOfMonth;
          })
          .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

        const totalSale = sales.reduce(
          (sum, s) => sum + Number(s.total_amount || 0),
          0
        );

        // Weekly chart data
        const weekData = getWeeklySalesData(sales);

        setStats({
          total: totalProducts,
          lowstock: lowStock,
          expirySoon: expirySoon,
          todaySale,
          weeklySale,
          monthlySale,
          totalSale,
          weekChart: weekData,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="container-fluid mt-4">
      <h2>Dashboard</h2>
      <div className="row g-3 mt-3">
        {/* Medicine Stats */}
        <div className="col-md-4">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5 className="card-title">Total Products</h5>
              <p className="card-text">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <h5 className="card-title">Low Stock (≤5)</h5>
              <p className="card-text">{stats.lowstock}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-danger">
            <div className="card-body">
              <h5 className="card-title">Expiry within 30 days</h5>
              <p className="card-text">{stats.expirySoon}</p>
            </div>
          </div>
        </div>

        {/* Sales Stats */}
        <div className="col-md-4">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5 className="card-title">Today's Sale</h5>
              <p className="card-text">₹{stats.todaySale.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-info">
            <div className="card-body">
              <h5 className="card-title">This Week Sale</h5>
              <p className="card-text">₹{stats.weeklySale.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-secondary">
            <div className="card-body">
              <h5 className="card-title">This Month Sale</h5>
              <p className="card-text">₹{stats.monthlySale.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-white bg-dark">
            <div className="card-body">
              <h5 className="card-title">Total Sale</h5>
              <p className="card-text">₹{stats.totalSale.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Sales Chart */}
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Weekly Sales Overview</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weekChart || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sale" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
