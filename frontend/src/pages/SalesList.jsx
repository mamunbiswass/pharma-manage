import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { Table, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function SalesList() {
  const [sales, setSales] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await API.get("/sales");
        setSales(res.data);
      } catch (err) {
        console.error("Failed to fetch sales:", err);
      }
    }
    fetchSales();
  }, []);

  return (
    <Card className="mt-4">
      <Card.Header>
        <h4>Sales List</h4>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((s) => (
                <tr key={s.id}>
                  <td>{s.invoice_number}</td>
                  <td>{s.customer_name || "Unknown"}</td>
                  <td>₹{Number(s.total).toFixed(2)}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                  <td>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/invoice/${s.id}`)}                      
                    >
                      View / Print
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No sales found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default SalesList;
