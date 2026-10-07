import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDoc,
} from "firebase/firestore";
import configData from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific databaseId provisioned by AI Studio
export const db = initializeFirestore(
  app,
  {},
  configData.firestoreDatabaseId || "(default)",
);

// Helper collection references
const productsCol = collection(db, "products");
const expensesCol = collection(db, "expenses");
const invoicesCol = collection(db, "invoices");
const sheetOrdersCol = collection(db, "sheetOrders");
const configDocRef = doc(db, "config", "counters");
const securityDocRef = doc(db, "config", "security");
const dealsDocRef = doc(db, "config", "deals");

/**
 * Standard error handler for Firestore operations
 */
function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Sync Sheet Orders in real-time
 */
export function syncSheetOrders(onUpdate, onError) {
  return onSnapshot(
    sheetOrdersCol,
    (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data());
      });
      // Sort orders by ID / date descending
      orders.sort((a, b) =>
        (b.orderId || b.id).localeCompare(a.orderId || a.id),
      );
      onUpdate(orders);
    },
    (err) => {
      handleFirestoreError(err, "list", "sheetOrders");
      if (onError) onError(err);
    },
  );
}

/**
 * Save / Update a Single Sheet Order
 */
export async function dbSaveSheetOrder(order) {
  const docRef = doc(db, "sheetOrders", String(order.id || order.orderId));
  await setDoc(docRef, order, { merge: true });
}

/**
 * Delete a Single Sheet Order
 */
export async function dbDeleteSheetOrder(orderId) {
  const docRef = doc(db, "sheetOrders", String(orderId));
  await deleteDoc(docRef);
}

/**
 * Sync Products in real-time
 */
export function syncProducts(onUpdate, onError) {
  return onSnapshot(
    productsCol,
    (snapshot) => {
      const products = [];
      snapshot.forEach((docSnap) => {
        products.push(docSnap.data());
      });
      // Sort by id for consistent UI display
      products.sort((a, b) => a.id - b.id);
      onUpdate(products);
    },
    (err) => {
      console.error("Firestore syncProducts error:", err);
      if (onError) onError(err);
    },
  );
}

/**
 * Sync Expenses in real-time
 */
export function syncExpenses(onUpdate, onError) {
  return onSnapshot(
    expensesCol,
    (snapshot) => {
      const expenses = [];
      snapshot.forEach((docSnap) => {
        expenses.push(docSnap.data());
      });
      expenses.sort((a, b) => a.id - b.id);
      onUpdate(expenses);
    },
    (err) => {
      console.error("Firestore syncExpenses error:", err);
      if (onError) onError(err);
    },
  );
}

/**
 * Sync Invoices in real-time
 */
export function syncInvoices(onUpdate, onError) {
  return onSnapshot(
    invoicesCol,
    (snapshot) => {
      const invoices = [];
      snapshot.forEach((docSnap) => {
        invoices.push(docSnap.data());
      });
      // Sort invoices descending by ID or date, but we sort by ID for consistent POS views
      invoices.sort((a, b) => b.id - a.id);
      onUpdate(invoices);
    },
    (err) => {
      console.error("Firestore syncInvoices error:", err);
      if (onError) onError(err);
    },
  );
}

/**
 * Sync Counters in real-time
 */
export function syncCounters(onUpdate, onError) {
  return onSnapshot(
    configDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else {
        // Default initial counter state
        onUpdate({ nextInv: 1001, nextProd: 7 });
      }
    },
    (err) => {
      console.error("Firestore syncCounters error:", err);
      if (onError) onError(err);
    },
  );
}

/**
 * Save / Update a Single Product
 */
export async function dbSaveProduct(product) {
  const docRef = doc(db, "products", String(product.id));
  await setDoc(docRef, product);
}

/**
 * Delete a Single Product
 */
export async function dbDeleteProduct(productId) {
  const docRef = doc(db, "products", String(productId));
  await deleteDoc(docRef);
}

/**
 * Save / Update a Single Expense
 */
export async function dbSaveExpense(expense) {
  const docRef = doc(db, "expenses", String(expense.id));
  await setDoc(docRef, expense);
}

/**
 * Delete a Single Expense
 */
export async function dbDeleteExpense(expenseId) {
  const docRef = doc(db, "expenses", String(expenseId));
  await deleteDoc(docRef);
}

/**
 * Save / Update a Single Invoice
 */
export async function dbSaveInvoice(invoice) {
  const docRef = doc(db, "invoices", String(invoice.id));
  await setDoc(docRef, invoice);
}

/**
 * Delete a Single Invoice
 */
export async function dbDeleteInvoice(invoiceId) {
  const docRef = doc(db, "invoices", String(invoiceId));
  await deleteDoc(docRef);
}

/**
 * Sync Security Password in real-time from Firebase
 */
export function syncPassword(onUpdate, onError) {
  return onSnapshot(
    securityDocRef,
    (docSnap) => {
      if (docSnap.exists() && docSnap.data().password) {
        onUpdate(docSnap.data().password);
      }
    },
    (err) => {
      console.error("Firestore syncPassword error:", err);
      if (onError) onError(err);
    },
  );
}

/**
 * Update global system counters
 */
export async function dbSaveCounters(nextInv, nextProd) {
  await setDoc(configDocRef, { nextInv, nextProd }, { merge: true });
}

/**
 * Save / Update System Password in Firebase
 */
export async function dbSavePassword(password) {
  await setDoc(
    securityDocRef,
    {
      password,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/**
 * Sync Deals in real-time from Firebase
 */
export function syncDeals(onUpdate, onError) {
  return onSnapshot(
    dealsDocRef,
    (docSnap) => {
      if (docSnap.exists() && docSnap.data().items) {
        onUpdate(docSnap.data().items);
      }
    },
    (err) => {
      console.error("Firestore syncDeals error:", err);
      if (onError) onError(err);
    },
  );
}

/**
 * Save / Update System Deals list in Firebase
 */
export async function dbSaveDeals(deals) {
  await setDoc(
    dealsDocRef,
    {
      items: deals,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/**
 * Batch upload / restore backup data to Firestore
 */
export async function dbImportBackup(backupObj) {
  const batch = writeBatch(db);

  if (backupObj.products && Array.isArray(backupObj.products)) {
    backupObj.products.forEach((prod) => {
      const docRef = doc(db, "products", String(prod.id));
      batch.set(docRef, prod);
    });
  }

  if (backupObj.expenses && Array.isArray(backupObj.expenses)) {
    backupObj.expenses.forEach((exp) => {
      const docRef = doc(db, "expenses", String(exp.id));
      batch.set(docRef, exp);
    });
  }

  if (backupObj.invoices && Array.isArray(backupObj.invoices)) {
    backupObj.invoices.forEach((inv) => {
      const docRef = doc(db, "invoices", String(inv.id));
      batch.set(docRef, inv);
    });
  }

  const nextInv =
    typeof backupObj.nextInv === "number" ? backupObj.nextInv : 1001;
  const nextProd =
    typeof backupObj.nextProd === "number" ? backupObj.nextProd : 7;
  batch.set(configDocRef, { nextInv, nextProd }, { merge: true });

  await batch.commit();
}

/**
 * Seeds initial database values if Firestore collections are completely empty
 */
export async function seedInitialDataIfEmpty(
  initialProducts,
  initialExpenses,
  initialDeals = [],
) {
  try {
    // Check and seed deals configuration if it doesn't exist yet
    const dealsSnap = await getDoc(dealsDocRef);
    if (!dealsSnap.exists() && initialDeals && initialDeals.length > 0) {
      console.log("Seeding initial promotional deals into Firestore...");
      await setDoc(
        dealsDocRef,
        {
          items: initialDeals,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }

    const countersSnap = await getDoc(configDocRef);
    const countersData = countersSnap.exists() ? countersSnap.data() : null;

    // If the database configuration documents indicate we have already seeded,
    // we strictly skip any further seeding checks, preventing deleted items from re-appearing.
    if (countersData && countersData.seeded) {
      console.log(
        "Firestore database has already been initialized. Skipping seeding checks.",
      );
      return;
    }

    const productsSnap = await getDocs(productsCol);
    if (productsSnap.empty) {
      console.log("Seeding initial products into Firestore...");
      const batch = writeBatch(db);
      initialProducts.forEach((prod) => {
        const docRef = doc(db, "products", String(prod.id));
        batch.set(docRef, prod);
      });
      await batch.commit();
    }

    const expensesSnap = await getDocs(expensesCol);
    if (expensesSnap.empty) {
      console.log("Seeding initial expenses into Firestore...");
      const batch = writeBatch(db);
      initialExpenses.forEach((exp) => {
        const docRef = doc(db, "expenses", String(exp.id));
        batch.set(docRef, exp);
      });
      await batch.commit();
    }

    console.log(
      "Marking database as successfully seeded to prevent auto-recreation of deleted items...",
    );
    await setDoc(
      configDocRef,
      {
        nextInv: countersData?.nextInv || 1001,
        nextProd: countersData?.nextProd || 7,
        seeded: true,
      },
      { merge: true },
    );
  } catch (err) {
    console.error("Error during Firestore seeding:", err);
  }
}
