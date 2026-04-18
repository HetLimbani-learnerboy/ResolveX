import React, {
  useEffect,
  useState
} from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;

const AuditComplaints = () => {
  const [complaints, setComplaints] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/complaints/all`
      );

      const data = await res.json();

      setComplaints(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================
     METRICS
  ====================================== */

  const totalReviewed =
    complaints.length;

  const correctCount =
    complaints.filter(
      (item) =>
        item.ai_confidence >= 80
    ).length;

  const accuracy =
    totalReviewed > 0
      ? (
          (correctCount /
            totalReviewed) *
          100
        ).toFixed(1)
      : 0;

  const incorrectCount =
    totalReviewed - correctCount;

  /* ======================================
     CATEGORY GRAPH
  ====================================== */

  const categories = [
    "Product",
    "Packaging",
    "Trade"
  ];

  const categoryData =
    categories.map((cat) => {
      const total =
        complaints.filter(
          (item) =>
            item.category === cat
        ).length;

      const correct =
        complaints.filter(
          (item) =>
            item.category === cat &&
            item.ai_confidence >=
              80
        ).length;

      return {
        name: cat,
        total,
        correct
      };
    });

  /* ======================================
     DAILY GRAPH
  ====================================== */

  const dailyMap = {};

  complaints.forEach((item) => {
    const day = new Date(
      item.created_at
    ).toLocaleDateString(
      "en-US",
      {
        weekday: "short"
      }
    );

    if (!dailyMap[day]) {
      dailyMap[day] = 0;
    }

    dailyMap[day]++;
  });

  const timeData = Object.keys(
    dailyMap
  ).map((day) => ({
    day,
    reviewed: dailyMap[day]
  }));

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>

      <h2
        style={{
          fontWeight: "600",
          marginBottom: "1.5rem"
        }}
      >
        Audit Complaints
      </h2>

      <div className="dashboard-grid">

        {/* Cards */}

        <div className="col-span-4">
          <div className="card">
            <div className="stat-value">
              {totalReviewed}
            </div>
            <div className="stat-label">
              Total Reviewed
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card">
            <div className="stat-value">
              {accuracy}%
            </div>
            <div className="stat-label">
              Classification
              Accuracy
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card">
            <div className="stat-value">
              {incorrectCount}
            </div>
            <div className="stat-label">
              Incorrectly Tagged
            </div>
          </div>
        </div>

        {/* Graph 1 */}

        <div className="col-span-6">
          <div
            className="card"
            style={{
              height: "400px"
            }}
          >
            <div className="card-header">
              <h3 className="card-title">
                Category Accuracy
              </h3>
            </div>

            <ResponsiveContainer
              width="100%"
              height="85%"
            >
              <BarChart
                data={categoryData}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="total"
                  fill="#94a3b8"
                />

                <Bar
                  dataKey="correct"
                  fill="#6366f1"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2 */}

        <div className="col-span-6">
          <div
            className="card"
            style={{
              height: "400px"
            }}
          >
            <div className="card-header">
              <h3 className="card-title">
                Complaint Review Time
              </h3>
            </div>

            <ResponsiveContainer
              width="100%"
              height="85%"
            >
              <LineChart
                data={timeData}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="day" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="reviewed"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}

        <div className="col-span-12">
          <div className="card">

            <div className="card-header">
              <h3 className="card-title">
                Recent Audits
              </h3>
            </div>

            <div
              style={{
                overflowX: "auto"
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse"
                }}
              >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>
                      AI Confidence
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {complaints
                    .slice(0, 10)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          <td>
                            {item.id.slice(
                              0,
                              8
                            )}
                          </td>

                          <td>
                            {
                              item.category
                            }
                          </td>

                          <td>
                            {
                              item.priority
                            }
                          </td>

                          <td>
                            {
                              item.status
                            }
                          </td>

                          <td>
                            {
                              item.ai_confidence
                            }
                            %
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditComplaints;