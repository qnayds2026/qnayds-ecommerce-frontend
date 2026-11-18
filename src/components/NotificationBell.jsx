import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import NotificationService from "../api/service/NotificationService";

const POLL_MS = 30000;

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCount = useCallback(async () => {
    try {
      const res = await NotificationService.getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await NotificationService.list({ page: 1, limit: 5 });
      setItems(res.data.notifications);
    } catch {
      /* ignore */
    }
  }, []);

  // Refresh count on mount, on every route change, and every 30s
  useEffect(() => {
    fetchCount();
  }, [fetchCount, location.pathname]);

  useEffect(() => {
    const id = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Close dropdown on outside click and on route change
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchLatest();
  };

  const handleItemClick = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await NotificationService.markAsRead(n.id);
      } catch {
        fetchCount();
      }
    }
    if (n.link) {
      if (/^https?:\/\//.test(n.link)) window.location.href = n.link;
      else navigate(n.link);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex items-center hover:text-[#2864F0]"
      >
        <Bell size={22} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#2864F0] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <p className="px-4 py-3 text-sm font-semibold text-[#101A30] border-b border-gray-100">
            Notifications
          </p>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">
              No notifications yet.
            </p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-50 hover:bg-[#F0F0F8] ${
                  n.isRead ? "bg-white" : "bg-[#EEF3FE]"
                }`}
              >
                <p
                  className={`text-sm text-[#101A30] ${
                    n.isRead ? "font-normal" : "font-semibold"
                  }`}
                >
                  {n.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
              </div>
            ))
          )}

          <Link
            to="/notifications"
            className="block text-center text-sm font-medium text-[#2864F0] py-3 hover:bg-[#F0F0F8]"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;