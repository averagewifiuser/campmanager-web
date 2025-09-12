import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

// Accept campId as an optional prop
interface SideNavProps {
  campId?: string;
}

const SideNav: React.FC<SideNavProps> = ({ campId }) => {
  const navItems = [
    ...(campId
      ? [
          {
            label: "Dashboard",
            to: `/camps/${campId}`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V7H7v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      label: "Payments",
      to: `/camps/${campId}/payments`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="10" rx="2" />
          <path d="M2 9h20" />
        </svg>
      ),
    },
    {
      label: "Financials",
      to: `/camps/${campId}/financials`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Pledges",
      to: `/camps/${campId}/pledges`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Inventory",
      to: `/camps/${campId}/inventory`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: "Purchases",
      to: `/camps/${campId}/purchases`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: "Rooms",
      to: `/camps/${campId}/rooms`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      ),
    },
    {
      label: "Room Allocations",
      to: `/camps/${campId}/room-allocations`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
      ),
    },
    {
      label: "Food",
      to: `/camps/${campId}/food`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
    },
    {
      label: "Food Allocations",
      to: `/camps/${campId}/food-allocations`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c.552 0 1-.448 1-1V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v3c0 .552.448 1 1 1h16z" />
          <path d="M3 12v4a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-4" />
        </svg>
      ),
    },
  ];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleCollapse = () => setCollapsed((prev) => !prev);
  const handleMobileToggle = () => setMobileOpen((prev) => !prev);

  return (
    <>
      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity md:hidden ${mobileOpen ? "block" : "hidden"}`} onClick={handleMobileToggle} />
      {/* SideNav */}
      <nav
        className={`
          fixed z-50 top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg
          flex flex-col transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:block
        `}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-2 border-b border-gray-100 relative">
          <span className={`font-bold text-lg transition-all ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>Menu</span>
          <button
            className="md:hidden p-2"
            onClick={handleMobileToggle}
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Always show collapse/expand button, absolutely positioned to be clickable even when collapsed */}
          <button
            className="hidden md:flex items-center justify-center p-2 absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full shadow"
            style={{ width: "2.5rem", height: "2.5rem" }}
            onClick={handleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              // Right arrow for expand
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" />
              </svg>
            ) : (
              // Left arrow for collapse
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            )}
          </button>
        </div>
        {/* Nav Items */}
        <ul className="flex-1 py-4 space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-md transition-colors
                  ${location.pathname === item.to ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}
                  ${collapsed ? "justify-center" : ""}
                `}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                <span className={`transition-all ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow md:hidden"
        onClick={handleMobileToggle}
        aria-label="Open sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Spacer for layout */}
      {/* <div className={`${collapsed ? "w-16" : "w-56"} hidden md:block`} /> */}
    </>
  );
};

export default SideNav;
