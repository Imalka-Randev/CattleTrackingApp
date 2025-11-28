// src/context/UserContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { checkServerHealth } from '../api/apiClient';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // holds user object returned by API
  const [token, setToken] = useState(null); // holds raw token string

  // Static cattle data + collar ids
  const [cattleList, setCattleList] = useState([]);
  const [collarIds, setCollarIds] = useState([]);
  const [cattleLoading, setCattleLoading] = useState(false);
  const [mapHasFocused, setMapHasFocused] = useState(false); // Persist map focus state
  const [mapRegion, setMapRegion] = useState(null); // Persist map region (lat, lon, deltas)
  const [isOnline, setIsOnline] = useState(true); // Track online status

  // Shared state for collar data: { [collarId]: apiResponse }
  const [collarData, setCollarData] = useState({});

  /**
   * Periodic Server Health Check
   * Checks server status every 30 seconds
   */
  useEffect(() => {
    const checkHealth = async () => {
      console.log('UserContext: Checking server health...');
      try {
        const health = await checkServerHealth();
        console.log('UserContext: Health check response:', health);
        if (health && health.ok) {
          if (!isOnline) {
            console.log('UserContext: Server connection restored');
            setIsOnline(true);
          }
        }
      } catch (error) {
        console.error('UserContext: Health check failed:', error.message);
        // If health check fails, we might be offline or server down
        // The interceptor in apiClient will handle showing the Toast
        if (isOnline) {
          console.log('UserContext: Server connection lost');
          setIsOnline(false);
        }
      }
    };

    // Initial check
    checkHealth();

    // Poll every 30 seconds
    const intervalId = setInterval(checkHealth, 30000);

    return () => clearInterval(intervalId);
  }, [isOnline]);

  /**
   * updateCollarData(id, data)
   * Updates a single collar's data in the shared state.
   */
  const updateCollarData = useCallback((id, data) => {
    setCollarData((prev) => ({
      ...prev,
      [id]: data,
    }));
  }, []);

  /**
   * updateMultipleCollarData(dataMap)
   * Updates multiple collars at once (e.g. from MapScreen polling).
   * dataMap: { [id]: data, ... }
   */
  const updateMultipleCollarData = useCallback((dataMap) => {
    setCollarData((prev) => ({
      ...prev,
      ...dataMap,
    }));
  }, []);

  /**
   * fetchCattle()
   * - Calls GET /api/cattles
   * - Stores full list in AsyncStorage ('@cattle_list')
   * - Extracts collarIds and stores in AsyncStorage ('@collar_ids')
   * - Updates context state (cattleList, collarIds)
   */
  const fetchCattle = useCallback(async () => {
    setCattleLoading(true);
    try {
      // api is axios instance with baseURL set in src/api/apiClient.js
      const res = await api.get('/api/cattles');
      const data = res?.data;

      if (!Array.isArray(data)) {
        // If API returns wrapped object, try to extract
        // e.g., { data: [...] } or similar. Adjust if your API differs.
        const maybeArray = data?.data || data?.result || [];
        if (!Array.isArray(maybeArray)) {
          console.warn('fetchCattle: unexpected response', data);
        }
        const finalArr = Array.isArray(maybeArray) ? maybeArray : [];
        setCattleList(finalArr);
        await AsyncStorage.setItem('@cattle_list', JSON.stringify(finalArr));

        const ids = finalArr
          .map((c) => (c.collarId ? String(c.collarId).trim() : null))
          .filter(Boolean);
        setCollarIds(ids);
        await AsyncStorage.setItem('@collar_ids', JSON.stringify(ids));
        return finalArr;
      }

      // If the API returned array directly:
      const finalArr = data;
      setCattleList(finalArr);
      await AsyncStorage.setItem('@cattle_list', JSON.stringify(finalArr));

      const ids = finalArr
        .map((c) => (c.collarId ? String(c.collarId).trim() : null))
        .filter(Boolean);
      setCollarIds(ids);
      await AsyncStorage.setItem('@collar_ids', JSON.stringify(ids));

      return finalArr;
    } catch (err) {
      console.error('fetchCattle error', err);
      return [];
    } finally {
      setCattleLoading(false);
    }
  }, []);

  /**
   * fetchCollarData()
   * - Iterates through known collarIds
   * - Fetches latest data for each
   * - Logs progress and responses
   * - Updates shared state
   */
  const fetchCollarData = useCallback(async () => {
    if (collarIds.length === 0) return;

    console.log('UserContext: Fetching collar data for IDs:', collarIds);

    const promises = collarIds.map(id =>
      api.get(`/api/collar-data/${id}`)
        .then(res => {
          console.log(`UserContext: API Response for ${id}:`, JSON.stringify(res.data, null, 2));
          return { ok: true, id: String(id), data: res.data };
        })
        .catch(err => {
          console.error(`UserContext: Error fetching ${id}:`, err);
          return { ok: false, id: String(id), error: err };
        })
    );

    const settled = await Promise.allSettled(promises);
    const dataMap = {};

    settled.forEach(s => {
      if (s.status === 'fulfilled' && s.value.ok) {
        const id = s.value.id;
        const data = s.value.data;
        if (id && data) {
          dataMap[id] = data;
        }
      }
    });

    if (Object.keys(dataMap).length > 0) {
      updateMultipleCollarData(dataMap);
      console.log('UserContext: Updated collar data for', Object.keys(dataMap).length, 'devices');
    }
  }, [collarIds, updateMultipleCollarData]);

  /**
   * login(tokenFromApi, userData)
   * - Save token + user to AsyncStorage
   * - Update local state (this will make AppNavigator show the main app)
   * - Immediately fetch static cattle data and store it locally
   */
  const login = async (tokenFromApi, userData) => {
    try {
      await AsyncStorage.setItem('@auth_token', tokenFromApi);
      await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
      setToken(tokenFromApi);
      setUser(userData);

      // Immediately fetch and store cattle list after login
      await fetchCattle();
    } catch (error) {
      console.error('UserContext.login error:', error);
      throw error;
    }
  };

  /**
   * logout()
   * - Remove token + user + cattle data from AsyncStorage
   * - Clear local state
   */
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        '@auth_token',
        '@auth_user',
        '@cattle_list',
        '@collar_ids',
      ]);
    } catch (error) {
      console.error('UserContext.logout clear error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setCattleList([]);
      setCollarIds([]);
      setMapHasFocused(false); // Reset map focus on logout
      setMapRegion(null); // Reset map region on logout
    }
  }, []);

  /**
   * Attach an interceptor to the shared axios instance (api):
   * - If any response has status 401, call logout() to clear storage and state.
   * Note: we register the interceptor inside useEffect, and eject on cleanup.
   */
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          // Token invalid / expired -> force logout
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      try {
        api.interceptors.response.eject(interceptorId);
      } catch (e) {
        // ignore
      }
    };
  }, [logout]);

  /**
   * On app start we do NOT auto-restore user/token (you requested auto-login disabled).
   * However, if you later enable auto-login you can restore token/user and then call fetchCattle()
   * NOTE: If you prefer the app to restore static cattle from AsyncStorage on start (even when user isn't auto-logged),
   * we can load '@cattle_list' and '@collar_ids' here into state. For now we keep auto-login disabled.
   */
  useEffect(() => {
    // Optionally restore cached cattle from storage (useful if you want to show cached data
    // immediately after a cold start even without re-fetching). This does NOT log in the user.
    const restoreCachedCattle = async () => {
      try {
        const storedCattle = await AsyncStorage.getItem('@cattle_list');
        const storedCollars = await AsyncStorage.getItem('@collar_ids');

        if (storedCattle) {
          setCattleList(JSON.parse(storedCattle));
        }
        if (storedCollars) {
          setCollarIds(JSON.parse(storedCollars));
        }
      } catch (err) {
        // ignore
      }
    };

    restoreCachedCattle();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        setUser, // kept for backward compat if other files still call setUser directly
        cattleList,
        collarIds,
        fetchCattle,
        cattleLoading,
        collarData, // Shared state for collar data: { [collarId]: apiResponse }
        updateCollarData,
        updateMultipleCollarData,
        mapHasFocused,
        setMapHasFocused,
        mapRegion,
        setMapRegion,
        fetchCollarData, // Exposed for manual triggering if needed
      }}
    >
      {children}
    </UserContext.Provider>
  );
};