import React, { useEffect, useState } from "react";
import { Card, Row, Col, Table, Button, Spinner } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import API from "../api/axios";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    todaySale: 0,
    todayBills: 0,
    lowStock: 0,
    expiringSoon: 0,
    totalCustomers: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [expiringList, setExpiringList] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  // ✅ Fetch Dashboard Data
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await API.get("/dashboard/summary");
        const data = res.data;

        // 🧮 Summary
        setSummary({
          todaySale: data.todaySale || 0,
          todayBills: data.todayBills || 0,
          lowStock: data.lowStock || 0,
          expiringSoon: data.expiringSoon || 0,
          totalCustomers: data.totalCustomers || 0,
        });

        // 📊 Weekly Chart
        setSalesData(
          (data.weeklySales || []).map((d) => ({
            date: d.day,
            total: parseFloat(d.total || 0),
          }))
        );

        // ⚠️ Low Stock List
        setLowStockList(
          (data.lowStockList || []).map((m) => ({
            name: m.name,
            qty: m.available_qty || 0,
            expiry: m.expiry_date
              ? new Date(m.expiry_date).toLocaleDateString("en-GB", {
                  month: "2-digit",
                  year: "2-digit",
                })
              : "-",
          }))
        );

        // ⏳ Expiring Soon List
        if (data.expiringList) {
          setExpiringList(
            data.expiringList.map((e) => ({
              name: e.name,
              expiry: e.expiry_date
                ? new Date(e.expiry_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })
                : "-",
            }))
          );
        }

        // 🧾 Recent Sales (latest 5)
        const salesRes = await API.get("/sales?limit=5");
        setRecentSales(
          (salesRes.data || []).slice(0, 5).map((s) => ({
            invoice: s.invoice_number,
            customer: s.customer_name || "Walk-in Customer",
            total: s.total || 0,
          }))
        );
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // 🔄 Loader
  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading Dashboard...</p>
      </div>
    );

  return (
    <div className="container-fluid mt-4">
      <h3 className="fw-bold mb-4">💊 Medicine Management Dashboard</h3>

      {/* ===== Summary Cards ===== */}
      <Row className="g-3 mb-4">
        <Col md={2}>
          <Card className="shadow-sm border-0 text-center p-3 bg-success text-white">
            <h6>
              <Activity size={22} /> <br />
              Today’s Sale
            </h6>
            <h3>₹{summary.todaySale.toLocaleString()}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm border-0 text-center p-3 bg-primary text-white">
            <h6>
              <ShoppingBag size={22} /> <br />
              Today’s Bills
            </h6>
            <h3>{summary.todayBills}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm border-0 text-center p-3 bg-danger text-white">
            <h6>
              <AlertTriangle size={22} /> <br />
              Low Stock
            </h6>
            <h3>{summary.lowStock}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm border-0 text-center p-3 bg-warning text-dark">
            <h6>
              <Clock size={22} /> <br />
              Expiring Soon
            </h6>
            <h3>{summary.expiringSoon}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm border-0 text-center p-3 bg-info text-dark">
            <h6>
              <Users size={22} /> <br />
              Customers
            </h6>
            <h3>{summary.totalCustomers}</h3>
          </Card>
        </Col>
      </Row>

      {/* ===== Weekly Chart & Low Stock ===== */}
      <Row className="g-4">
        <Col md={8}>
          <Card className="shadow-sm border-0 p-3">
            <h5 className="fw-bold mb-3">📈 Weekly Sales Overview</h5>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#28a745" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted">No sales data available</p>
            )}
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm border-0 p-3">
            <h5 className="fw-bold mb-3">⚠️ Low Stock Items</h5>
            <Table striped size="sm" responsive>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Exp</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.length > 0 ? (
                  lowStockList.map((m, i) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td
                        className={m.qty <= 5 ? "text-danger fw-bold" : ""}
                      >
                        {m.qty}
                      </td>
                      <td>{m.expiry}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted">
                      ✅ All stocks are sufficient
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {/* ===== Expiring Soon & Recent Sales ===== */}
      <Row className="mt-4 g-4">
        <Col md={6}>
          <Card className="shadow-sm border-0 p-3">
            <h5 className="fw-bold mb-3">
              ⏳ Expiring Soon Medicines (Next 30 Days)
            </h5>
            <Table bordered hover size="sm" responsive>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {expiringList.length > 0 ? (
                  expiringList.map((e, i) => (
                    <tr key={i}>
                      <td>{e.name}</td>
                      <td>{e.expiry}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center text-muted">
                      ✅ No medicines expiring soon
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm border-0 p-3">
            <h5 className="fw-bold mb-3">🧾 Recent Sales</h5>
            <Table bordered hover size="sm" responsive>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s, i) => (
                  <tr key={i}>
                    <td>{s.invoice}</td>
                    <td>{s.customer}</td>
                    <td>₹{Number(s.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {/* ===== Quick Actions ===== */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm border-0 p-3 text-center">
            <h5 className="fw-bold mb-3">⚙️ Quick Actions</h5>
            <div className="d-grid gap-2 d-sm-flex justify-content-center flex-wrap">
              <Button variant="success" href="/sales/add">
                ➕ Add Sale
              </Button>
              <Button variant="primary" href="/purchase/add">
                📦 Add Purchase
              </Button>
              <Button variant="info" href="/stock">
                📋 View Stock
              </Button>
              <Button variant="warning" href="/customers">
                👥 Manage Customers
              </Button>
              <Button variant="dark" href="/reports">
                🧾 Reports
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
