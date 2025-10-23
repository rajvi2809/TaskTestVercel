import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import "./ReportsPage.css";

function ReportsPage() {
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [revenueRes, customersRes, salesRes] = await Promise.all([
        api.get("/orders/reports/daily-revenue"),
        api.get("/orders/reports/top-customers"),
        api.get("/products/sales-summary"),
      ]);

      setDailyRevenue(revenueRes.data.dailyRevenue);
      setTopCustomers(customersRes.data.topCustomers);
      setCategorySales(salesRes.data.summary);
    } catch (error) {
      setError("Failed to load reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatReportDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="reports-page">
      <h1>Reports & Analytics</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="reports-container">
        {/* Daily Revenue Report (SQL Aggregation) */}
        <div className="report-card">
          <h2>Daily Revenue Report</h2>
          <p className="subtitle">SQL Aggregation - Revenue by Date</p>
          {dailyRevenue.length === 0 ? (
            <p className="no-data">No revenue data available</p>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRevenue.map((item, idx) => (
                    <tr key={idx}>
                      <td>{formatReportDate(item.date)}</td>
                      <td className="amount">
                        ₹{parseFloat(item.revenue || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Customers Report (SQL Aggregation) */}
        <div className="report-card">
          <h2>Top Customers Report</h2>
          <p className="subtitle">
            SQL Aggregation - Customer Rankings by Total Spent
          </p>
          {topCustomers.length === 0 ? (
            <p className="no-data">No customer data available</p>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, idx) => (
                    <tr key={idx}>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td className="center">{customer.order_count}</td>
                      <td className="amount">
                        ₹{parseFloat(customer.total_spent || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Sales Report (MongoDB Aggregation) */}
        <div className="report-card">
          <h2>Category Sales Summary</h2>
          <p className="subtitle">
            MongoDB Aggregation - Product Statistics by Category
          </p>
          {categorySales.length === 0 ? (
            <p className="no-data">No category data available</p>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Avg Price</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySales.map((category, idx) => (
                    <tr key={idx}>
                      <td>{category._id}</td>
                      <td className="center">{category.totalProducts}</td>
                      <td className="amount">
                        ₹{parseFloat(category.avgPrice || 0).toFixed(2)}
                      </td>
                      <td className="amount">
                        ₹{parseFloat(category.minPrice || 0).toFixed(2)}
                      </td>
                      <td className="amount">
                        ₹{parseFloat(category.maxPrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* <div className="reports-info">
        <h3>Report Information</h3>
        <ul>
          <li>
            <strong>Daily Revenue Report:</strong> Shows total revenue
            aggregated by date using SQL SUM() and GROUP BY functions.
          </li>
          <li>
            <strong>Top Customers Report:</strong> Lists customers ranked by
            total amount spent, calculated using SQL aggregation functions.
          </li>
          <li>
            <strong>Category Sales Summary:</strong> Displays product statistics
            per category including count, average, minimum, and maximum prices
            using MongoDB aggregation pipeline.
          </li>
        </ul>
      </div> */}
    </div>
  );
}

export default ReportsPage;
