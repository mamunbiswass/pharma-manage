import React, { useState } from 'react';
import Papa from 'papaparse';
import API from '../api/axios';

function ImportCSV() {
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const medicines = results.data.filter(row => row.name && row.category);

        if (medicines.length === 0) {
          alert("CSV file is empty or invalid!");
          return;
        }

        try {
          setLoading(true);
          // ✅ Send all medicines at once
          const res = await API.post('/medicines/bulk', medicines);
          alert(res.data.message || "CSV import completed!");
        } catch (err) {
          console.error("CSV import error:", err);
          alert("Failed to import medicines!");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <h2>📥 Import Medicines (CSV)</h2>
      <input type="file" accept=".csv" onChange={handleFile} />
      {loading && <p>Uploading... Please wait.</p>}
    </div>
  );
}

export default ImportCSV;
