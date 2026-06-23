import { createContext, useContext, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabNavigationContext = createContext(null);

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}

/**
 * Provides independent navigation stacks for bottom tabs.
 * - Switching tabs preserves the last visited path per tab.
 * - Re-selecting the active tab resets it to its root.
 */
export function TabNavigationProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tabStacks = useRef({});

  const handleTabPress = useCallback((targetTab, allTabs) => {
    // Find which tab the current path belongs to
    const currentTab = allTabs.find(t =>
      location.pathname === t || location.pathname.startsWith(t + '/')
    );

    if (currentTab === targetTab) {
      // Re-selecting the active tab — reset to root
      tabStacks.current[targetTab] = null;
      navigate(targetTab);
    } else {
      // Switching to a different tab — preserve current path
      if (currentTab) {
        tabStacks.current[currentTab] = location.pathname;
      }
      // Navigate to the target tab's last known path, or its root
      const targetPath = tabStacks.current[targetTab] || targetTab;
      navigate(targetPath);
    }
  }, [location.pathname, navigate]);

  return (
    <TabNavigationContext.Provider value={{ handleTabPress }}>
      {children}
    </TabNavigationContext.Provider>
  );
}