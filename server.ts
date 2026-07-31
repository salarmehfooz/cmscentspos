import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to fetch from Google Apps Script Web App securely
async function fetchFromSheetUrl(
  targetUrl: string,
  method: string = "GET",
  bodyData?: any,
) {
  try {
    let finalRes: Response;
    if (method === "GET") {
      finalRes = await fetch(targetUrl, { redirect: "follow" });
    } else {
      // For POST requests, manual 302 handling prevents conversion to GET on redirect
      const initRes = await fetch(targetUrl, {
        method: "POST",
        redirect: "manual",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData || {}),
      });

      if (initRes.status === 302 || initRes.status === 301) {
        const location = initRes.headers.get("location");
        if (location) {
          finalRes = await fetch(location, { redirect: "follow" });
        } else {
          finalRes = initRes;
        }
      } else {
        finalRes = initRes;
      }
    }

    const text = await finalRes.text();
    try {
      return { isJson: true, data: JSON.parse(text), rawText: text };
    } catch {
      return { isJson: false, data: null, rawText: text };
    }
  } catch (err: any) {
    console.error("Fetch error from Google Apps Script:", err);
    throw err;
  }
}

// API Route: Get Google Sheet Orders (Proxying environment variable URL)
app.get("/api/sheet-orders", async (req, res) => {
  const DEFAULT_SHEET_URL =
    "https://script.google.com/macros/s/AKfycbzJ-e6FbB2zm2FMgSjBQ3lUu19z0hn1MmtlilHSrzUP2kuuKLVN1_s0B2g5n6fO1EEVrA/exec";
  const sheetUrl =
    process.env.SHEET_ORDERS_URL ||
    process.env.VITE_SHEET_ORDERS_URL ||
    DEFAULT_SHEET_URL;

  try {
    // 1. Try plain sheet URL first
    let fetched = await fetchFromSheetUrl(sheetUrl, "GET");

    if (fetched.isJson && Array.isArray(fetched.data)) {
      return res.json({
        success: true,
        urlConfigured: true,
        orders: fetched.data,
        source: "google_sheets",
      });
    } else if (
      fetched.isJson &&
      fetched.data &&
      Array.isArray(fetched.data.orders)
    ) {
      return res.json({
        success: true,
        urlConfigured: true,
        orders: fetched.data.orders,
        source: "google_sheets",
      });
    }

    // 2. Try with action parameters if plain fetch did not return array directly
    const getUrl = sheetUrl.includes("?")
      ? `${sheetUrl}&action=getOrders&type=getOrders`
      : `${sheetUrl}?action=getOrders&type=getOrders`;
    fetched = await fetchFromSheetUrl(getUrl, "GET");

    if (fetched.isJson && Array.isArray(fetched.data)) {
      return res.json({
        success: true,
        urlConfigured: true,
        orders: fetched.data,
        source: "google_sheets",
      });
    } else if (
      fetched.isJson &&
      fetched.data &&
      Array.isArray(fetched.data.orders)
    ) {
      return res.json({
        success: true,
        urlConfigured: true,
        orders: fetched.data.orders,
        source: "google_sheets",
      });
    }

    // Default response if Google Apps Script returns default text (or non-JSON)
    return res.json({
      success: true,
      urlConfigured: true,
      rawResponse: fetched.rawText,
      orders: [],
      message:
        "Connected to Google Apps Script. Web App endpoint responded successfully.",
    });
  } catch (error: any) {
    console.error("Error in /api/sheet-orders proxy:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch from Google Sheet URL",
      orders: [],
    });
  }
});

// API Route: Confirm Order Callback to Google Sheet
app.post("/api/sheet-orders/confirm", async (req, res) => {
  const sheetUrl =
    process.env.SHEET_ORDERS_URL || process.env.VITE_SHEET_ORDERS_URL;
  const { orderId, invoiceId, status } = req.body;

  if (!sheetUrl) {
    return res
      .status(400)
      .json({ success: false, message: "SHEET_ORDERS_URL not set" });
  }

  try {
    const postResult = await fetchFromSheetUrl(sheetUrl, "POST", {
      action: "confirmOrder",
      orderId,
      invoiceId,
      status: status || "Confirmed",
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Order #${orderId} marked as confirmed on Google Sheet`,
      sheetResponse: postResult.rawText,
    });
  } catch (err: any) {
    console.error("Confirm order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// API Route: Mark Order as Shipped Callback to Google Sheet
app.post("/api/sheet-orders/ship", async (req, res) => {
  const sheetUrl =
    process.env.SHEET_ORDERS_URL || process.env.VITE_SHEET_ORDERS_URL;
  const { orderId, invoiceId, status, shippedAt } = req.body;

  if (!sheetUrl) {
    return res
      .status(400)
      .json({ success: false, message: "SHEET_ORDERS_URL not set" });
  }

  try {
    const postResult = await fetchFromSheetUrl(sheetUrl, "POST", {
      action: "shipOrder",
      orderId,
      invoiceId,
      status: status || "Shipped",
      shippedAt: shippedAt || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Order #${orderId} marked as shipped on Google Sheet`,
      sheetResponse: postResult.rawText,
    });
  } catch (err: any) {
    console.error("Ship order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// API Route: Delete Order Callback to Google Sheet
app.post("/api/sheet-orders/delete", async (req, res) => {
  const DEFAULT_SHEET_URL =
    "https://script.google.com/macros/s/AKfycbzJ-e6FbB2zm2FMgSjBQ3lUu19z0hn1MmtlilHSrzUP2kuuKLVN1_s0B2g5n6fO1EEVrA/exec";
  const sheetUrl =
    process.env.SHEET_ORDERS_URL ||
    process.env.VITE_SHEET_ORDERS_URL ||
    DEFAULT_SHEET_URL;
  const { orderId, id } = req.body;
  const targetId = orderId || id;

  if (!targetId) {
    return res.status(400).json({
      success: false,
      message: "orderId or id is required for deletion",
    });
  }

  try {
    // 1. Send POST request with delete action
    const postResult = await fetchFromSheetUrl(sheetUrl, "POST", {
      action: "deleteOrder",
      type: "deleteOrder",
      orderId: targetId,
      id: targetId,
      timestamp: new Date().toISOString(),
    });

    // 2. Also trigger GET request with query params in case Apps Script uses doGet for actions
    const delGetUrl = sheetUrl.includes("?")
      ? `${sheetUrl}&action=deleteOrder&orderId=${encodeURIComponent(targetId)}`
      : `${sheetUrl}?action=deleteOrder&orderId=${encodeURIComponent(targetId)}`;
    await fetchFromSheetUrl(delGetUrl, "GET").catch(() => {});

    return res.json({
      success: true,
      message: `Order #${targetId} deleted and synced with Google Sheet`,
      sheetResponse: postResult.rawText,
    });
  } catch (err: any) {
    console.error("Delete order error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Vite middleware or Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
