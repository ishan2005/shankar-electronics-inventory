import { useState } from "react";

export default function InventoryForm({
  onAddStock,
  stock,
  onSell,
  onReturn,
  calculateDaysInStock,
}) {
  /* ================= ADD STOCK ================= */
  const [showForm, setShowForm] = useState(false);
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [imei, setImei] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  /* ================= ACTION MODAL ================= */
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // SOLD | RETURNED
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionDate, setActionDate] = useState("");

  /* ================= ADD STOCK SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!model || !variant || !imei || !quantity || !purchaseDate) {
      alert("Please fill all fields");
      return;
    }

    onAddStock({
      model,
      variant,
      imei,
      quantity: Number(quantity),
      purchaseDate,
      status: "IN_STOCK",
      actionDate: null,
    });

    setModel("");
    setVariant("");
    setImei("");
    setQuantity("");
    setPurchaseDate("");
    setShowForm(false);
  };

  /* ================= OPEN ACTION MODAL ================= */
  const openModal = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setActionDate("");
    setShowModal(true);
  };

  /* ================= CONFIRM ACTION ================= */
  const confirmAction = () => {
    if (!actionDate) {
      alert("Please select a date");
      return;
    }

    if (actionType === "SOLD") {
      onSell(selectedItem, actionDate);
    }

    if (actionType === "RETURNED") {
      onReturn(selectedItem, actionDate);
    }

    setShowModal(false);
    setSelectedItem(null);
    setActionType(null);
    setActionDate("");
  };

  /* ================= SORT OLD STOCK FIRST ================= */
  const sortedStock = [...stock].sort(
    (a, b) =>
      calculateDaysInStock(b.purchaseDate) -
      calculateDaysInStock(a.purchaseDate)
  );

  return (
    <>
      {/* ========== ADD STOCK TOGGLE ========== */}
      <button
        className="btn-primary"
        style={{ width: "100%", marginBottom: "16px" }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Close Add Stock" : "Add New Stock"}
      </button>

      {/* ========== ADD STOCK FORM ========== */}
      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          <input placeholder="Variant" value={variant} onChange={(e) => setVariant(e.target.value)} />
          <input placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)} />
          <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />

          <button className="btn-success" style={{ width: "100%", marginTop: "10px" }}>
            Save Stock
          </button>
        </form>
      )}

      {/* ========== STOCK LIST ========== */}
      {sortedStock.length === 0 && (
        <p style={{ textAlign: "center", color: "#607d8b" }}>
          No stock available
        </p>
      )}

      {sortedStock.map((item) => {
        const days = calculateDaysInStock(item.purchaseDate);
        const isOld = days > 90;

        return (
          <div
            key={item.docId}
            className={`card ${isOld ? "old-stock" : ""}`}
            style={{ marginBottom: "16px" }}
          >
            {isOld && (
              <div className="old-stock-badge">
                Over 90 days — Return to company
              </div>
            )}

            <div style={{ fontSize: "18px", fontWeight: "700" }}>
              {item.model}
            </div>
            <div style={{ color: "#546e7a" }}>{item.variant}</div>
            <div>IMEI: {item.imei}</div>
            <div>Qty: {item.quantity}</div>
            <div>
              Days in stock: <b>{days}</b>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
              <button
                className="btn-success"
                style={{ flex: 1 }}
                onClick={() => openModal(item, "SOLD")}
              >
                Sold
              </button>

              <button
                className="btn-warning"
                style={{ flex: 1 }}
                onClick={() => openModal(item, "RETURNED")}
              >
                Return
              </button>
            </div>
          </div>
        );
      })}

      {/* ========== ACTION DATE MODAL ========== */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div className="card" style={{ width: "90%", maxWidth: "360px" }}>
            <h3 style={{ marginBottom: "12px" }}>
              {actionType === "SOLD"
                ? "Select Sale Date"
                : "Select Return Date"}
            </h3>

            <input
              type="date"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={confirmAction}>
                Confirm
              </button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
