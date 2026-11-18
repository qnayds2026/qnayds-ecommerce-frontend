import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationService from "../api/service/NotificationService";

const LIMIT = 10;

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationService.getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch {
      /* non-critical */
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await NotificationService.list({ page, limit: LIMIT, unreadOnly });
      setNotifications(res.data.notifications);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const markAsRead = async (n) => {
    if (n.isRead) return;
    setNotifications((list) =>
      list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await NotificationService.markAsRead(n.id);
    } catch {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const handleClick = async (n) => {
    await markAsRead(n);
    if (n.link) {
      if (/^https?:\/\//.test(n.link)) window.location.href = n.link;
      else navigate(n.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      setError(err.message || "Failed to mark all as read");
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>
          Notifications{" "}
          {unreadCount > 0 && (
            <span style={{ background: "#e11d48", color: "#fff", borderRadius: 12, padding: "2px 10px", fontSize: 14 }}>
              {unreadCount}
            </span>
          )}
        </h1>
        <button onClick={markAllAsRead} disabled={unreadCount === 0}>
          Mark all as read
        </button>
      </div>

      <div style={{ margin: "12px 0" }}>
        <button onClick={() => { setUnreadOnly(false); setPage(1); }} disabled={!unreadOnly}>
          All
        </button>{" "}
        <button onClick={() => { setUnreadOnly(true); setPage(1); }} disabled={unreadOnly}>
          Unread
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && notifications.length === 0 && <p>No notifications yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {notifications.map((n) => (
          <li
            key={n.id}
            onClick={() => handleClick(n)}
            style={{
              cursor: n.isRead && !n.link ? "default" : "pointer",
              padding: 14,
              marginBottom: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: n.isRead ? "#fff" : "#eff6ff",
              fontWeight: n.isRead ? 400 : 600,
            }}
          >
            <div>{n.title}</div>
            {n.message && <div style={{ fontWeight: 400, color: "#4b5563" }}>{n.message}</div>}
            <small style={{ color: "#6b7280" }}>{timeAgo(n.createdAt)}</small>
          </li>
        ))}
      </ul>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Prev</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>Next</button>
        </div>
      )}
    </div>
  );
}