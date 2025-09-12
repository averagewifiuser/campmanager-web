import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { getFilteredNavItems } from "../../lib/permissions";

// Accept campId as an optional prop
interface SideNavProps {
  campId?: string;
}

const SideNav: React.FC<SideNavProps> = ({ campId }) => {
  const { user } = useAuth();
  
  // Get filtered navigation items based on user permissions
  const navItems = campId ? getFilteredNavItems(user, campId) : [];

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
