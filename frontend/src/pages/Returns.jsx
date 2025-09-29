import React, { useEffect, useState } from "react";
import axios from "axios";

function Returns() {
  const [returns, setReturns] = useState([]);
  const [form, setForm] = useState({ medicineId: "", quantity: "", reason: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/returns");
      setReturns(res.data);
    } catch (err) {
      console.error("Error fetching returns:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/returns", form);
      setMessage("✅ Return added successfully!");
      setForm({ medicineId: "", quantity: "", reason: "" });
      fetchReturns();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error adding return:", err);
      setMessage("❌ Failed to add return");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📦 Returns Management</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="medicineId"
          placeholder="Medicine ID"
          value={form.medicineId}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="reason"
          placeholder="Reason"
          value={form.reason}
          onChange={handleChange}
        />
        <button type="submit">Add Return</button>
      </form>

      <h3>📋 Returns List</h3>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Medicine</th>
            <th>Quantity</th>
            <th>Reason</th>
            <th>Return Date</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.medicine_name}</td>
              <td>{r.quantity}</td>
              <td>{r.reason}</td>
              <td>{new Date(r.return_date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Returns;
