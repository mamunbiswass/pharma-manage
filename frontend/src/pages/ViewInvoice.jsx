import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaMobile, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const ViewInvoice = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef();

  useEffect(() => {
    // fetch sale
    axios
      .get(`http://localhost:5000/api/sales/${id}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const saleInfo = {
            sale_id: res.data[0].sale_id,
            invoice_number: res.data[0].invoice_number,
            invoice_date: res.data[0].invoice_date,
            total_amount: res.data[0].total_amount,
            customer_name: res.data[0].customer_name,
            items: res.data.map((row) => ({
              medicine_name: row.medicine_name,
              quantity: row.quantity,
              price: row.price,
              mrp_price: row.mrp_price,
              gst_rate: row.gst_rate,
              gst_amount: row.gst_amount,
              discount_amount: row.discount_amount,
              expiry_date: row.expiry_date,
            })),
          };
          setSale(saleInfo);
        }
      })
      .catch((err) => console.error(err));

    // fetch business info
    axios
      .get("http://localhost:5000/api/business")
      .then((res) => setBusiness(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const totalDiscount = sale
    ? sale.items.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0)
    : 0;
  const totalGst = sale
    ? sale.items.reduce((sum, item) => sum + parseFloat(item.gst_amount || 0), 0)
    : 0;

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: sale ? `Invoice_${sale.invoice_number}` : "Invoice",
    removeAfterPrint: true,
  });

  const handleDownload = () => {
    if (!sale) return;

    const doc = new jsPDF();
    let y = 20;

    if (business && business.logo) {
      const img = new Image();
      img.src = `http://localhost:5000/uploads/logo/${business.logo}`;
      img.onload = () => {
        doc.addImage(img, "PNG", 14, y, 40, 20);
        doc.setFontSize(14);
        doc.text(`${business.name}`, 60, y + 10);
        doc.text(`${business.address}`, 60, y + 16);
        doc.text(`Phone: ${business.phone} | Email: ${business.email}`, 60, y + 22);
        generateTable(doc);
      };
    } else {
      if (business) {
        doc.setFontSize(14);
        doc.text(`${business.name}`, 14, y);
        doc.text(`${business.address}`, 14, y + 6);
        doc.text(`Phone: ${business.phone} | Email: ${business.email}`, 14, y + 12);
      }
      generateTable(doc);
    }

    function generateTable(doc) {
      const tableColumn = [
        "Medicine",
        "Expiry",
        "MRP",
        "Price",
        "Qty",
        "GST %",
        "GST Amt",
        "Discount",
        "Net",
      ];
      const tableRows = [];

      sale.items.forEach((item) => {
        const net =
          parseFloat(item.price || 0) * parseFloat(item.quantity || 0) -
          parseFloat(item.discount_amount || 0) +
          parseFloat(item.gst_amount || 0);

        tableRows.push([
          item.medicine_name,
          item.expiry_date,
          parseFloat(item.mrp_price || 0).toFixed(2),
          parseFloat(item.price || 0).toFixed(2),
          parseFloat(item.quantity || 0),
          parseFloat(item.gst_rate || 0).toFixed(2),
          parseFloat(item.gst_amount || 0).toFixed(2),
          parseFloat(item.discount_amount || 0).toFixed(2),
          net.toFixed(2),
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text(`Total Discount: ₹${totalDiscount.toFixed(2)}`, 14, finalY);
      doc.text(`Total GST: ₹${totalGst.toFixed(2)}`, 14, finalY + 8);
      doc.text(
        `Grand Total: ₹${(parseFloat(sale.total_amount) || 0).toFixed(2)}`,
        14,
        finalY + 16
      );

      doc.save(`Invoice_${sale.invoice_number}.pdf`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!sale) return <p>No data found</p>;

  return (
    <div className="container mt-4">
      {/* Invoice Content with ref */}
      <div ref={componentRef} className="invoice-content p-3 border rounded">
        <div className="d-flex justify-content-between mb-4 align-items-center">
          <div className="d-flex align-items-center">
            {business && business.logo ? (
              <>
                <img
                  src={`http://localhost:5000/uploads/logo/${business.logo}`}
                  alt="Logo"
                  style={{ maxHeight: "80px", marginRight: "15px" }}
                />
                <div>
                  <h2 className="mb-1">{business.name}</h2>
                  <p className="mb-0">
                    <FaMapMarkerAlt /> {business.address}
                  </p>
                  <p className="mb-0">
                    <FaMobile /> {business.phone} | <FaEnvelope /> {business.email}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h2 className="mb-1">{business?.name}</h2>
                <p className="mb-0">
                  <FaMapMarkerAlt /> {business?.address}
                </p>
                <p className="mb-0">
                  <FaMobile /> {business?.phone} | <FaEnvelope /> {business?.email}
                </p>
              </div>
            )}
          </div>

          <div className="text-end">
            <h4>Invoice #{sale.invoice_number}</h4>
            <p className="mb-0">Date: {sale.invoice_date}</p>
            <p className="mb-0">Customer: {sale.customer_name}</p>
          </div>
        </div>

        {/* Items Table */}
        <h4>Items</h4>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Expiry</th>
              <th>MRP</th>
              <th>Price</th>
              <th>Qty</th>
              <th>GST %</th>
              <th>GST Amt</th>
              <th>Discount</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{item.medicine_name}</td>
                <td>{item.expiry_date}</td>
                <td>{parseFloat(item.mrp_price || 0).toFixed(2)}</td>
                <td>{parseFloat(item.price || 0).toFixed(2)}</td>
                <td>{parseFloat(item.quantity || 0)}</td>
                <td>{parseFloat(item.gst_rate || 0).toFixed(2)}</td>
                <td>{parseFloat(item.gst_amount || 0).toFixed(2)}</td>
                <td>{parseFloat(item.discount_amount || 0).toFixed(2)}</td>
                <td>
                  {(
                    parseFloat(item.price || 0) * parseFloat(item.quantity || 0) -
                    parseFloat(item.discount_amount || 0) +
                    parseFloat(item.gst_amount || 0)
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="text-end mt-4">
          <h5>Total Discount: ₹{totalDiscount.toFixed(2)}</h5>
          <h5>Total GST: ₹{totalGst.toFixed(2)}</h5>
          <h4>Grand Total: ₹{(parseFloat(sale.total_amount) || 0).toFixed(2)}</h4>
        </div>
      </div>

      {/* Action Buttons (hide in print) */}
      <div className="mt-3 no-print">
        <button className="btn btn-primary me-2" onClick={handlePrint}>
          🖨️ Print
        </button>
        <button className="btn btn-success" onClick={handleDownload}>
          ⬇️ Download PDF
        </button>
      </div>
    </div>
  );
};

export default ViewInvoice;
