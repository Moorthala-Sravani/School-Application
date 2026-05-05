import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchBusRoute } from '../../store/slices/busSlice';
import api from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { hs, vs, ms } from '../../theme/scale';

const BusLocationScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { busData, loading, error } = useSelector((state: RootState) => state.bus);
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicle'>('routes');

  // Bus routes tab state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');
  const [routeOptions, setRouteOptions] = useState<any[]>([]);
  const [selectedRouteOption, setSelectedRouteOption] = useState<any | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  // Any vehicle tab state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [trackingVehicleEnabled, setTrackingVehicleEnabled] = useState(false);

  // Recently tracked (client-side)
  const [recentTracks, setRecentTracks] = useState<any[]>([]);

  const recentStorageKey = 'bus_recent_tracks_v1';

  const normalizeReg = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Format as: KA 01 AB 1234 (best-effort; works even when user types gradually)
  const formatRegistrationNumber = (raw: string) => {
    const cleaned = normalizeReg(raw);
    const state = cleaned.slice(0, 2);
    const district = cleaned.slice(2, 4);
    const series = cleaned.slice(4, 6);
    const number = cleaned.slice(6, 10);

    const parts: string[] = [];
    if (state) parts.push(state);
    if (district) parts.push(district);
    if (series) parts.push(series);
    if (number) parts.push(number);
    return parts.join(' ').trim();
  };

  const canTrackVehicle = useMemo(() => {
    const cleaned = normalizeReg(registrationNumber);
    // “Number is long enough” – require at least state(2)+district(2)+series(2)+4-digit number
    return cleaned.length >= 10;
  }, [registrationNumber]);

  const routeSearchQuery = routeSearch.trim();

  const busTrackingQueryForRouteTab = (opt: any) =>
    String(opt?._track_query || opt?.route_number || opt?.routeNumber || opt?.bus_number || opt?.busNumber || '');

  const upsertRecentTrack = (payload: any) => {
    const routeNo = String(payload?.route_number || payload?.routeNumber || payload?.route_name || '');
    const routeName = payload?.route_name || payload?.routeName || null;
    const busNo = String(payload?.bus_number || payload?.busNumber || '');
    const vehicleNo = String(payload?.vehicle_number || payload?.vehicleNumber || '');

    const key = `${routeNo}__${vehicleNo || busNo}`.trim();
    if (!key || key === '__') return;

    const nextItem = {
      id: key,
      route_number: routeNo || null,
      route_name: routeName,
      bus_number: busNo || null,
      vehicle_number: vehicleNo || null,
      is_active: payload?.is_active ?? payload?.active ?? null,
      lastTrackedAt: Date.now(),
    };

    setRecentTracks((prev) => {
      const without = prev.filter((x) => `${x.route_number || ''}__${x.bus_number || ''}`.trim() !== key);
      const updated = [nextItem, ...without].slice(0, 10);
      AsyncStorage.setItem(recentStorageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  useEffect(() => {
    // Load recent tracks on mount
    AsyncStorage.getItem(recentStorageKey)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentTracks(parsed);
      })
      .catch(() => {});
  }, []);

  const displayedRouteOptions = useMemo(() => {
    const q = routeSearchQuery.toLowerCase();
    const options = routeOptions || [];

    const filtered = options.filter((opt: any) => {
      const busNo = String(opt.bus_number || opt.busNumber || '').toLowerCase();
      const routeNo = String(opt.route_number || opt.routeNumber || '').toLowerCase();
      const routeName = String(opt.route_name || opt.routeName || '').toLowerCase();
      const content = [busNo, routeNo, routeName].join(' ');
      return q.length === 0 ? true : content.includes(q);
    });

    const seen = new Set<string>();
    const merged: any[] = [];

    // Recently tracked should always be visible inside dropdown.
    recentTracks.forEach((t) => {
      const key = String(t.route_number || '');
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push({
        id: `recent-${t.id || `${t.route_number}-${t.bus_number}`}`,
        route_number: t.route_number,
        route_name: t.route_name || t.route_number,
        bus_number: t.bus_number,
        vehicle_number: t.vehicle_number,
        is_active: t.is_active ?? null,
        _track_query: String(t.route_number || ''),
        _recent: true,
      });
    });

    filtered.forEach((opt: any) => {
      const key = String(opt.route_number || opt.routeNumber || opt.bus_number || opt.busNumber || '');
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push({
        ...opt,
        _track_query: String(opt.route_number || opt.routeNumber || opt.bus_number || opt.busNumber || ''),
      });
    });

    // If backend search fails, still allow selecting a “custom” value.
    if (q.length > 0 && !merged.some((x: any) => String(x._track_query || '').toLowerCase() === q)) {
      merged.unshift({
        id: 'custom',
        route_number: routeSearchQuery,
        route_name: `Custom: ${routeSearchQuery}`,
        bus_number: null,
        is_active: false,
        _track_query: routeSearchQuery,
      });
    }

    return merged;
  }, [routeOptions, routeSearchQuery, recentTracks]);

  useEffect(() => {
    // Route list search (best-effort). If backend doesn’t support it, dropdown will fallback to recent items + custom option.
    if (activeTab !== 'routes') return;
    if (!dropdownOpen) return;
    if (routeSearchQuery.length < 2) {
      setRouteOptions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/bus-routes/search?query=${encodeURIComponent(routeSearchQuery)}`);
        const list = Array.isArray(res.data) ? res.data : res.data?.results;
        if (Array.isArray(list)) setRouteOptions(list);
      } catch {
        setRouteOptions([]);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [activeTab, dropdownOpen, routeSearchQuery]);

  const selectRouteOption = async (opt: any) => {
    setSelectedRouteOption(opt);
    setTrackingEnabled(false);
    setTrackingVehicleEnabled(false);
    Keyboard.dismiss();

    const query = busTrackingQueryForRouteTab(opt);
    if (!query) return;

    try {
      // Load preview details immediately after selection.
      const payload = await dispatch(fetchBusRoute(query)).unwrap();
      upsertRecentTrack(payload);
    } catch {
      // Preview might fail, but selection still exists.
    }
  };

  const trackSelectedRoute = async () => {
    if (!selectedRouteOption) return;
    const query = busTrackingQueryForRouteTab(selectedRouteOption);
    if (!query) return;

    setTrackingEnabled(true);
    setTrackingVehicleEnabled(false);
    Keyboard.dismiss();

    // Ensure we have data for the selection.
    try {
      const payload = await dispatch(fetchBusRoute(query)).unwrap();
      upsertRecentTrack(payload);
    } catch {
      // ignore
    }
  };

  const trackAnyVehicle = async () => {
    const cleaned = normalizeReg(registrationNumber);
    if (!canTrackVehicle || !cleaned) return;

    setSelectedRouteOption(null);
    setTrackingVehicleEnabled(true);
    setTrackingEnabled(true);
    Keyboard.dismiss();

    try {
      const payload = await dispatch(fetchBusRoute(cleaned)).unwrap();
      upsertRecentTrack(payload);
    } catch {
      // ignore
    }
  };

  const isTracking = trackingEnabled && (trackingVehicleEnabled || !!selectedRouteOption);

  const renderRouteDot = (opt: any) => {
    const active = opt?.is_active === true || opt?.active === true || opt?.isActive === true;
    const dotColor = active ? colors.present : '#F4B183'; // amber-ish
    return <View style={[styles.routeDot, { backgroundColor: dotColor }]} />;
  };

  const stopsPreview = (stops: any[] | undefined) => {
    if (!Array.isArray(stops)) return null;
    const slice = stops.slice(0, 4);
    return (
      <View style={styles.previewStops}>
        {slice.map((stop, idx) => (
          <View key={stop.id || idx} style={styles.previewStopRow}>
            <Text style={[styles.previewStopIndex, idx === 0 ? { color: colors.primary } : null]}>{idx + 1}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewStopName} numberOfLines={1}>
                {stop.stop_name || stop.name || 'Stop'}
              </Text>
              <Text style={styles.previewStopTime}>{stop.eta_time || stop.time || ''}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#E67E22" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bus Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'routes' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('routes');
              setDropdownOpen(false);
              setSelectedRouteOption(null);
              setTrackingEnabled(false);
              setTrackingVehicleEnabled(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'routes' && styles.tabTextActive]}>Bus number</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'vehicle' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('vehicle');
              setDropdownOpen(false);
              setSelectedRouteOption(null);
              setTrackingEnabled(false);
              setTrackingVehicleEnabled(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'vehicle' && styles.tabTextActive]}>Any vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* Bus routes tab */}
        {activeTab === 'routes' && (
          <>
            <View style={styles.searchContainer}>
              <TouchableOpacity
                style={styles.searchInputWrap}
                onPress={() => setDropdownOpen(true)}
                activeOpacity={0.9}
              >
                {!selectedRouteOption ? (
                  <Text style={styles.searchPlaceholder}>Choose a bus route…</Text>
                ) : (
                  <Text style={styles.searchSelectedText} numberOfLines={1}>
                    {selectedRouteOption.route_name || selectedRouteOption.route_number}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {dropdownOpen && (
              <View style={styles.dropdown}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Type to search by bus number or route name"
                  placeholderTextColor="#95A5A6"
                  value={routeSearch}
                  onChangeText={setRouteSearch}
                  autoCapitalize="characters"
                />

                <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
                  {displayedRouteOptions.length === 0 ? (
                    <Text style={styles.dropdownEmpty}>No routes found.</Text>
                  ) : (
                    displayedRouteOptions.map((opt: any) => (
                      <TouchableOpacity
                        key={opt.id || `${opt.route_number || ''}-${opt.bus_number || ''}`}
                        style={styles.dropdownOptionRow}
                        onPress={() => {
                          setDropdownOpen(false);
                          selectRouteOption(opt);
                        }}
                      >
                        <View style={styles.dropdownOptionDotWrap}>{renderRouteDot(opt)}</View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dropdownOptionTitle} numberOfLines={1}>
                            {opt.route_name || opt.route_number || opt.bus_number || 'Route'}
                          </Text>
                          <Text style={styles.dropdownOptionSub} numberOfLines={1}>
                            {opt.bus_number ? `Bus ${opt.bus_number}` : `Route ${opt.route_number}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* Preview card after selecting */}
            {selectedRouteOption && busData && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Route preview</Text>
                <View style={styles.previewTopRow}>
                  <View style={styles.previewHeaderDotWrap}>{renderRouteDot(selectedRouteOption)}</View>
                  <Text style={styles.previewRouteName}>
                    {busData.route_name || busData.route_number || selectedRouteOption.route_name || selectedRouteOption.route_number}
                  </Text>
                </View>

                <Text style={styles.previewMeta}>
                  Bus: {busData.bus_number || selectedRouteOption.bus_number || '—'} • Driver: {busData.driver_name || '—'}
                </Text>

                {stopsPreview(busData.stops)}
              </View>
            )}

            <TouchableOpacity
              style={[styles.trackBtn, !selectedRouteOption && { opacity: 0.5 }]}
              disabled={!selectedRouteOption}
              onPress={trackSelectedRoute}
            >
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Any vehicle tab */}
        {activeTab === 'vehicle' && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Registration number (e.g. KA 01 AB 1234)"
                placeholderTextColor="#95A5A6"
                value={registrationNumber}
                onChangeText={(t) => setRegistrationNumber(formatRegistrationNumber(t))}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={[styles.trackBtn, !canTrackVehicle && { opacity: 0.55 }]}
              disabled={!canTrackVehicle}
              onPress={trackAnyVehicle}
            >
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>

            {/* Preview card after tracking */}
            {busData && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Vehicle details</Text>
                <Text style={styles.previewMeta}>
                  Vehicle: {busData.vehicle_number || busData.bus_number || '—'} • Route: {busData.route_number || busData.route_name || '—'}
                </Text>
                {stopsPreview(busData.stops)}
              </View>
            )}
          </>
        )}

        {/* Map + timeline only after Track */}
        {isTracking && (
          <>
            <View style={styles.mapArea}>
              {busData ? (
                <WebView
                  source={{ html: getMapHtml(17.440081, 78.348915) }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.mapMockupBg}>
                  <Text style={{ fontSize: ms(50), opacity: 0.2 }}>🗺️</Text>
                  <Text style={styles.mapMockupText}>Loading map...</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Route timeline</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#E67E22" style={{ marginTop: vs(20) }} />
            ) : error ? (
              <Text style={{ color: 'red', textAlign: 'center', marginTop: vs(20) }}>{error}</Text>
            ) : busData && busData.stops ? (
              <View style={styles.timeline}>
                {busData.stops.map((stop: any, index: number) => {
                  const passed = index < 2;
                  const current = index === 2;
                  const isHome = index === busData.stops.length - 1;

                  return (
                    <View key={stop.id || index} style={styles.stopItem}>
                      {index !== busData.stops.length - 1 && (
                        <View style={[styles.timelineLine, passed ? { backgroundColor: '#E67E22' } : {}]} />
                      )}

                      <View
                        style={[
                          styles.stopDot,
                          passed && styles.stopDotPassed,
                          current && styles.stopDotCurrent,
                          isHome && styles.stopDotHome,
                        ]}
                      >
                        {current && <View style={styles.stopDotCurrentInner} />}
                        {isHome && <Text style={{ fontSize: ms(10) }}>🏠</Text>}
                      </View>

                      <View style={styles.stopContent}>
                        <Text
                          style={[
                            styles.stopName,
                            passed && { color: colors.textSecond },
                            current && { color: '#E67E22', fontWeight: '800' },
                          ]}
                        >
                          {stop.stop_name}
                        </Text>
                        <Text style={styles.stopTime}>{stop.eta_time}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        )}

        {/* Recently tracked */}
        <Text style={[styles.sectionTitle, { marginTop: vs(22) }]}>Recently tracked</Text>
        {recentTracks.length === 0 ? (
          <Text style={styles.emptyText}>No recent tracks yet.</Text>
        ) : (
          recentTracks.map((t) => {
            const opt = {
              id: `recent-${t.id || `${t.route_number}-${t.bus_number}`}`,
              route_number: t.route_number,
              route_name: t.route_name || t.route_number,
              bus_number: t.bus_number,
              vehicle_number: t.vehicle_number,
              is_active: t.is_active ?? null,
              _track_query: String(t.route_number || ''),
            };

            return (
              <TouchableOpacity
                key={opt.id}
                style={styles.recentRow}
                onPress={() => {
                  setActiveTab('routes');
                  setDropdownOpen(false);
                  setSelectedRouteOption(opt);
                  setTrackingEnabled(false);
                  setTrackingVehicleEnabled(false);
                  selectRouteOption(opt);
                }}
              >
                <View style={styles.recentDotWrap}>{renderRouteDot(opt)}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {opt.route_name || `Route ${opt.route_number}`}
                  </Text>
                  <Text style={styles.recentSub} numberOfLines={1}>
                    {opt.bus_number && opt.vehicle_number
                      ? `Bus ${opt.bus_number} • Vehicle ${opt.vehicle_number}`
                      : opt.vehicle_number
                        ? `Vehicle ${opt.vehicle_number}`
                        : opt.bus_number
                          ? `Bus ${opt.bus_number}`
                          : 'Bus —'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E67E22', paddingHorizontal: hs(16), paddingVertical: vs(12), zIndex: 10 },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 34, color: '#FFF', lineHeight: 34, marginTop: -4 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  tabsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: hs(14), borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginTop: vs(18) },
  tabBtn: { flex: 1, paddingVertical: vs(12), alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  tabBtnActive: { backgroundColor: '#E67E22' },
  tabText: { fontSize: ms(13), fontWeight: '700', color: colors.textSecond },
  tabTextActive: { color: '#FFF' },

  mapArea: { height: vs(230), backgroundColor: '#E0E0E0', width: '100%', borderRadius: hs(14), overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  mapMockupBg: { flex: 1, backgroundColor: '#D5D8DC', alignItems: 'center', justifyContent: 'center' },
  mapMockupText: { color: '#7F8C8D', fontSize: ms(16), fontWeight: '600', marginTop: vs(8) },
  mockMarker: { position: 'absolute', top: '40%', left: '50%', width: hs(40), height: hs(40), borderRadius: hs(20), backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },
  mockMarkerIcon: { fontSize: ms(20) },

  container: { padding: hs(20), paddingBottom: vs(40) },

  searchContainer: { flexDirection: 'row', marginBottom: vs(20), marginTop: -vs(10) },
  searchInputWrap: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF', borderRadius: hs(10), paddingHorizontal: hs(14), paddingVertical: vs(14) },
  searchPlaceholder: { color: '#95A5A6', fontSize: ms(13), fontWeight: '600' },
  searchSelectedText: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '700' },
  
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, padding: hs(16), borderRadius: hs(16), marginTop: -vs(40), marginBottom: vs(24), elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  driverAvatar: { width: hs(50), height: hs(50), borderRadius: hs(25), backgroundColor: '#FFF2E6', alignItems: 'center', justifyContent: 'center', marginRight: hs(16) },
  driverInfo: { flex: 1 },
  driverName: { fontSize: ms(16), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(2) },
  busNumber: { fontSize: ms(13), color: colors.textSecond },
  callBtn: { width: hs(40), height: hs(40), borderRadius: hs(20), backgroundColor: 'rgba(46, 204, 113, 0.15)', alignItems: 'center', justifyContent: 'center' },
  callIcon: { fontSize: ms(18) },

  sectionTitle: { fontSize: ms(18), fontWeight: '700', color: colors.textPrimary, marginBottom: vs(20) },

  dropdown: { backgroundColor: '#FFF', borderRadius: hs(12), borderWidth: 1, borderColor: colors.border, padding: hs(12), marginBottom: vs(14) },
  dropdownSearch: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: colors.border, borderRadius: hs(10), paddingHorizontal: hs(12), height: vs(44), fontSize: ms(14), color: colors.textPrimary, marginBottom: vs(10) },
  dropdownList: { maxHeight: 240 },
  dropdownEmpty: { color: colors.textSecond, textAlign: 'center', paddingVertical: vs(18) },
  dropdownOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(10) },
  dropdownOptionDotWrap: { marginRight: hs(10) },
  dropdownOptionTitle: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '700' },
  dropdownOptionSub: { color: colors.textSecond, fontSize: ms(12), fontWeight: '600' },
  routeDot: { width: hs(12), height: hs(12), borderRadius: hs(6) },

  trackBtn: { marginTop: vs(10), backgroundColor: '#E67E22', paddingVertical: vs(14), borderRadius: hs(12), alignItems: 'center' },
  trackBtnText: { color: '#FFF', fontSize: ms(16), fontWeight: '700' },

  previewCard: { marginTop: vs(14), backgroundColor: colors.bgLight, borderRadius: hs(16), padding: hs(16), borderWidth: 1, borderColor: colors.border, marginBottom: vs(14) },
  previewTitle: { color: colors.textPrimary, fontSize: ms(16), fontWeight: '800', marginBottom: vs(10) },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(8) },
  previewHeaderDotWrap: { marginRight: hs(10) },
  previewRouteName: { color: colors.textPrimary, fontSize: ms(15), fontWeight: '800', flex: 1 },
  previewMeta: { color: colors.textSecond, fontSize: ms(13), fontWeight: '600', marginBottom: vs(10) },

  previewStops: { marginTop: vs(10) },
  previewStopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(8) },
  previewStopIndex: { width: hs(20), fontWeight: '800', color: colors.textSecond },
  previewStopName: { color: colors.textPrimary, fontSize: ms(13), fontWeight: '700' },
  previewStopTime: { color: colors.textSecond, fontSize: ms(12), fontWeight: '600', marginTop: vs(2) },

  emptyText: { color: colors.textSecond, textAlign: 'center', marginTop: vs(10) },

  recentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgLight, borderRadius: hs(12), padding: hs(12), borderWidth: 1, borderColor: colors.border, marginBottom: vs(10) },
  recentDotWrap: { marginRight: hs(10) },
  recentTitle: { color: colors.textPrimary, fontSize: ms(14), fontWeight: '800', marginBottom: vs(2) },
  recentSub: { color: colors.textSecond, fontSize: ms(12), fontWeight: '600' },

  timeline: { paddingLeft: hs(8) },
  stopItem: { flexDirection: 'row', marginBottom: vs(24), position: 'relative' },
  timelineLine: { position: 'absolute', left: hs(11), top: vs(24), bottom: -vs(24), width: 2, backgroundColor: '#E0E0E0', zIndex: -1 },
  
  stopDot: { width: hs(24), height: hs(24), borderRadius: hs(12), backgroundColor: '#E0E0E0', marginRight: hs(16), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  stopDotPassed: { backgroundColor: '#E67E22' },
  stopDotCurrent: { backgroundColor: '#FFF', borderColor: '#E67E22', borderWidth: 3 },
  stopDotCurrentInner: { width: hs(10), height: hs(10), borderRadius: hs(5), backgroundColor: '#E67E22' },
  stopDotHome: { backgroundColor: '#3498DB', borderWidth: 0, width: hs(28), height: hs(28), borderRadius: hs(14), left: -2 },

  stopContent: { flex: 1, justifyContent: 'center', marginTop: -vs(2) },
  stopName: { fontSize: ms(15), fontWeight: '600', color: colors.textPrimary, marginBottom: vs(2) },
  stopTime: { fontSize: ms(12), color: colors.textSecond },

  searchInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D5D8DC', borderRadius: hs(8), paddingHorizontal: hs(16), height: vs(48), fontSize: ms(14), color: '#2C3E50', marginRight: hs(10) },
  searchBtn: { backgroundColor: '#E67E22', paddingHorizontal: hs(20), borderRadius: hs(8), justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#FFF', fontWeight: '700', fontSize: ms(14) }
});

const getMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100vw; }
        .bus-icon { font-size: 24px; text-align: center; background: white; border-radius: 50%; border: 2px solid #E67E22; box-shadow: 0 0 10px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        var busIcon = L.divIcon({
            html: '<div class="bus-icon">🚌</div>',
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        var marker = L.marker([${lat}, ${lng}], {icon: busIcon}).addTo(map);
        
        // Simulating bus movement like Swiggy delivery
        var currentLat = ${lat};
        var currentLng = ${lng};
        setInterval(() => {
            currentLat += 0.00005;
            currentLng += 0.00005;
            marker.setLatLng([currentLat, currentLng]);
            map.panTo([currentLat, currentLng], {animate: true, duration: 1});
        }, 2000);
    </script>
</body>
</html>
`;

export default BusLocationScreen;
