import { useState, useEffect } from "react";
import InventoryForm from "./components/InventoryForm";
import Login from "./components/login";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {
  /* 🔐 AUTH */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 📦 DATA */
  const [currentStock, setCurrentStock] = useState([]);
  const [soldStock, setSoldStock] = useState([]);
  const [returnedStock, setReturnedStock] = useState([]);
  const [historyStock, setHistoryStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesView, setSalesView] = useState("TODAY");

  /* 🔐 AUTH LISTENER */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* 🔥 FIRESTORE REALTIME SYNC */
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const all = snapshot.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }));

      setHistoryStock(all);
      setCurrentStock(all.filter((i) => i.status === "IN_STOCK"));
      setSoldStock(all.filter((i) => i.status === "SOLD"));
      setReturnedStock(all.filter((i) => i.status === "RETURNED"));
    });

    return () => unsub();
  }, [user]);

  /* ⏳ LOADING / LOGIN */
  if (loading) return <div style={{ padding: 40 }}>Checking login…</div>;
  if (!user) return <Login />;

  /* 🚪 LOGOUT */
  const logout = async () => await signOut(auth);

  /* ➕ ADD STOCK */
  const addStock = async (item) =>
    await addDoc(collection(db, "inventory"), item);

 const handleSell = async (item, selectedDate) => {
  await updateDoc(doc(db, "inventory", item.docId), {
    status: "SOLD",
    actionDate: selectedDate, // 👈 USER-SELECTED DATE
  });
};

const handleReturn = async (item, selectedDate) => {
  await updateDoc(doc(db, "inventory", item.docId), {
    status: "RETURNED",
    actionDate: selectedDate, // 👈 USER-SELECTED DATE
  });
};


  /* 📅 DAYS IN STOCK */
  const calculateDaysInStock = (date) =>
    Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24)
    );

  /* 🔍 SEARCH */
  const filteredStock = currentStock.filter(
    (i) =>
      i.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.imei.includes(searchTerm)
  );

  /* 📊 SALES CALCULATION */
  const today = new Date().toISOString().split("T")[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  const month = new Date().getMonth();
  const year = new Date().getFullYear();

  const todaysSales = soldStock.filter(
    (i) => i.actionDate === today
  );

  const yesterdaysSales = soldStock.filter(
    (i) => i.actionDate === yesterday
  );

  const mtdSales = soldStock.filter((i) => {
    const d = new Date(i.actionDate);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const getSalesList = () => {
  if (salesView === "TODAY") return todaysSales;
  if (salesView === "YESTERDAY") return yesterdaysSales;
  return mtdSales;
};


  /* 📊 EXCEL EXPORT (4 SHEETS) */
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const format = (data) =>
      data.map((i) => ({
        Model: i.model,
        Variant: i.variant,
        IMEI: i.imei,
        Quantity: i.quantity,
        "Purchase Date": i.purchaseDate,
        "Action Date": i.actionDate || "",
        Status: i.status,
      }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(format(currentStock)),
      "Current Stock"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(format(soldStock)),
      "Sold Stock"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(format(returnedStock)),
      "Returned Stock"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(format(historyStock)),
      "Full History"
    );

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "Shankar_Electronics_Inventory.xlsx");
  };

  /* 🎨 STAT CARD STYLE */
  const statCardStyle = (bg) => ({
    background: bg,
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  });

  return (
    <div
  style={{
    maxWidth: "720px",
    margin: "auto",
    padding: "12px",
  }}
>
  {/* 📊 SALES VIEW SWITCH */}
<div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "10px",
  }}
>
  <button
    className={salesView === "TODAY" ? "btn-primary" : ""}
    style={{ flex: 1 }}
    onClick={() => setSalesView("TODAY")}
  >
    Today
  </button>

  <button
    className={salesView === "YESTERDAY" ? "btn-primary" : ""}
    style={{ flex: 1 }}
    onClick={() => setSalesView("YESTERDAY")}
  >
    Yesterday
  </button>

  <button
    className={salesView === "MTD" ? "btn-primary" : ""}
    style={{ flex: 1 }}
    onClick={() => setSalesView("MTD")}
  >
    MTD
  </button>
</div>

{/* 📋 SALES LIST */}
<div style={{ marginBottom: "24px" }}>
  {getSalesList().length === 0 && (
    <p style={{ textAlign: "center", color: "#607d8b" }}>
      No sales recorded
    </p>
  )}

  {getSalesList().map((item) => (
    <div
      key={item.docId}
      className="card"
      style={{ marginBottom: "12px" }}
    >
      <b>{item.model}</b>
      <div>{item.variant}</div>
      <div>IMEI: {item.imei}</div>
      <div>Qty: {item.quantity}</div>
      <div>
        Sale Date: <b>{item.actionDate}</b>
      </div>
    </div>
  ))}
</div>

      {/* HEADER */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          position: "sticky",
top: 0,
zIndex: 20,

        }}
      >
        <div>
          <div className="neon-brand" style={{ fontSize: "22px" }}>
            SHANKAR ELECTRONICS
          </div>
          <div style={{ fontSize: "13px", color: "#455a64" }}>
            Samsung SmartPlaza
          </div>
        </div>

        <div>
          <button
            onClick={exportToExcel}
            style={{ marginRight: "8px", padding: "10px 14px" }}
          >
            Export
          </button>
          <button
            onClick={logout}
            style={{
              padding: "10px 14px",
              background: "#c62828",
              color: "white",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* SALES DASHBOARD */}
     <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  }}
>

        <div style={statCardStyle("#e3f2fd")}>
          <h4>Today</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>
            {todaysSales.length}
          </p>
        </div>

        <div style={statCardStyle("#ede7f6")}>
          <h4>Yesterday</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>
            {yesterdaysSales.length}
          </p>
        </div>

        <div style={statCardStyle("#e8f5e9")}>
          <h4>Month To Date</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>
            {mtdSales.length}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search Model / IMEI"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
  width: "100%",
  padding: "14px",
  fontSize: "17px",
  marginBottom: "20px",
  borderRadius: "14px",
}}

      />

      {/* INVENTORY */}
      <InventoryForm
        onAddStock={addStock}
        stock={filteredStock}
        onSell={handleSell}
        onReturn={handleReturn}
        calculateDaysInStock={calculateDaysInStock}
      />
    </div>
  );
}
