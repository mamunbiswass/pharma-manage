import React from "react";
import { saveAs } from "file-saver";

function DownloadSampleCSV() {
  const downloadCSV = () => {
    const csvContent = `name,category,manufacturer,pack_size,hsn_code,gst_rate,batch_no,supplier,purchase_price,sale_price,mrp_price,quantity,reorder_level,unit,expiry_date
Paracetamol,Tablet,Cipla,10s,30045010,5,BATCH001,ABC Pharma,10.5,12,15,100,20,strip,2025-12-31
Amoxicillin,Capsule,Sun Pharma,6s,30031010,12,BATCH002,XYZ Pharma,25,30,40,50,10,box,2024-11-15
Cough Syrup,Syrup,Dr Reddy,100ml,30049011,18,BATCH003,Medico Supplier,40,50,60,25,5,bottle,2025-08-20`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "medicine_template.csv");
  };

  return (
    <button
      onClick={downloadCSV}
      className="btn btn-sm btn-outline-primary"
    >
      📥 Download Sample CSV
    </button>
  );
}

export default DownloadSampleCSV;
