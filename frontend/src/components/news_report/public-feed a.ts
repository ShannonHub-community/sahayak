import type { NextApiRequest, NextApiResponse } from 'next';
import type { PublicAlert } from '@/types/alerts';

// Realistic nationwide & state disaster management alerts ordered newest-first
const MOCK_PUBLIC_ALERTS: PublicAlert[] = [
  {
    id: 'ALT-NDMA-2026-089',
    title: 'Dam Sluice Gate Discharge Advisory — Krishna River Basin',
    message: 'Due to continuous heavy catchment rainfall, 4 spillway gates at Almatti & Narayanpur dams have been opened discharging 1,45,000 cusecs. Residents along low-lying riverbanks in Raichur, Yadgir, and downstream Telangana districts must move to designated higher ground shelters immediately. Avoid crossing submersible bridges.',
    severity: 'critical',
    state: 'Karnataka',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
  },
  {
    id: 'ALT-IMD-2026-114',
    title: 'Red Alert for Extremely Heavy Downpour — Konkan & Coastal Maharashtra',
    message: 'India Meteorological Department (IMD) issues Red Alert warning of isolated extremely heavy rainfall (>204.4 mm) over Raigad, Ratnagiri, Sindhudurg, Thane, and Mumbai MMR over the next 24 hours. Local trains and ghat road routes may face waterlogging and landslide disruptions.',
    severity: 'critical',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(), // 42 mins ago
  },
  {
    id: 'ALT-SDRF-2026-076',
    title: 'Immediate Evacuation Order — Ward 14 & 18 (Gadiguda / Riverside)',
    message: 'Local administration has activated mandatory evacuation for wards 14 and 18. Municipal transport buses are deployed at Old Bus Stand for safe transit to Municipal High School relief camp. Carry essential medicines and identity documents.',
    severity: 'critical',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1 hr 15 mins ago
  },
  {
    id: 'ALT-NDRF-2026-052',
    title: 'NDRF 5th Battalion Deployed for Water Rescue Operations',
    message: 'Three deep-water rescue teams equipped with motorized inflatable boats (IRBs), life jackets, and medical trauma kits have been positioned at Panvel Creek and Pen tehsil. In emergency distress, submit SOS on this portal or dial 112.',
    severity: 'warning',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(), // ~2 hours ago
  },
  {
    id: 'ALT-CWC-2026-041',
    title: 'Central Water Commission — Godavari & Pranhita River Level Watch',
    message: 'Godavari river at Kaleshwaram and Bhadrachalam is flowing 1.8 meters above danger level. First flood warning signal hoisted. Fishermen and cattle owners are advised not to venture near riverbanks.',
    severity: 'warning',
    state: 'Telangana',
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(), // ~3.5 hours ago
  },
  {
    id: 'ALT-NHAI-2026-033',
    title: 'Traffic Diversion on National Highway 66 (Mumbai-Goa Corridor)',
    message: 'Water accumulation of 2.5 feet observed near Kashedi ghat bypass. Heavy commercial vehicles diverted via Karad-Chiplun route. Light passenger vehicles strictly advised to postpone non-emergency night travel.',
    severity: 'warning',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(), // ~5 hours ago
  },
  {
    id: 'ALT-DIST-2026-028',
    title: 'Designated Relief Camp Activated at Pillai Engineering College (Panvel)',
    message: 'District Disaster Management Authority has activated relief shelter at Pillai College Campus, New Panvel. Food packets, dry ration, clean drinking water, infant milk, and emergency medical triage are functional 24x7. Capacity: 1,500 PAX.',
    severity: 'info',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(), // ~6.5 hours ago
  },
  {
    id: 'ALT-HEALTH-2026-019',
    title: 'Emergency Medical & Mobile Dialysis Units Stationed at District Hospitals',
    message: 'Civil Hospital Panvel, Gandhi Hospital, and MGM Hospital Kamothe have established dedicated 24x7 emergency dialysis and insulin cold-storage stations for displaced flood victims. Free medical aid provided under Ayushman Bharat protocol.',
    severity: 'info',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 520).toISOString(), // ~8.5 hours ago
  },
  {
    id: 'ALT-DISCOM-2026-015',
    title: 'Precautionary Power Isolation in Waterlogged Low-Lying Sub-Stations',
    message: 'State Electricity Distribution Board has temporarily isolated 11kV distribution feeders in submerged sectors to prevent electrocution hazards. Power will be restored post de-watering inspection. Keep phone batteries conserved.',
    severity: 'warning',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 680).toISOString(), // ~11 hours ago
  },
  {
    id: 'ALT-NDMA-2026-012',
    title: 'Clean Drinking Water Tankers Deployed across 22 Transit Nodes',
    message: 'Public Health Engineering Department has dispatched chlorinated drinking water tankers across designated relief points. Citizens are advised to boil tap water for minimum 3 minutes before consumption to prevent waterborne diseases.',
    severity: 'info',
    state: 'National',
    timestamp: new Date(Date.now() - 1000 * 60 * 820).toISOString(), // ~13.5 hours ago
  },
  {
    id: 'ALT-RAIL-2026-009',
    title: 'Central Railway Suburban & Outstation Train Status Advisory',
    message: 'Suburban train services between Panvel and Kurla on Harbour line are operating under speed restrictions of 30 km/h due to water near track level at Tilak Nagar. Outstation trains via Konkan railway rescheduled.',
    severity: 'info',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 1020).toISOString(), // ~17 hours ago
  },
  {
    id: 'ALT-IMD-2026-005',
    title: 'Cyclone Surveillance Bulletin — Bay of Bengal Depression',
    message: 'Deep depression over West-Central Bay of Bengal has intensified into Cyclonic Storm. Coastal Andhra Pradesh and South Odisha ports have raised Local Cautionary Signal LC-III. Fishermen advised not to venture into deep sea.',
    severity: 'warning',
    state: 'Odisha',
    timestamp: new Date(Date.now() - 1000 * 60 * 1250).toISOString(), // ~20 hours ago
  },
  {
    id: 'ALT-TELECOM-2026-004',
    title: 'Intra-Circle Roaming (ICR) Activated across All Telecom Operators',
    message: 'Department of Telecommunications has activated bilateral intra-circle roaming across BSNL, Jio, Airtel, and Vi in disaster-notified districts. Citizens can connect emergency calls on any available mobile network even with zero native operator signal.',
    severity: 'info',
    state: 'National',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 24 hours ago
  },
  {
    id: 'ALT-NDMA-2026-003',
    title: 'Nationwide 112 Emergency Disaster Response Grid Synchronized',
    message: 'National Emergency Response Support System (ERSS 112) is actively routing SMS-based and web-based SOS signals directly to District Emergency Operation Centers (DEOCs) nationwide with guaranteed SMS delivery ack.',
    severity: 'info',
    state: 'National',
    timestamp: new Date(Date.now() - 1000 * 60 * 1680).toISOString(), // 28 hours ago
  },
  {
    id: 'ALT-CIVIL-2026-002',
    title: 'Civil Defense & Aapda Mitra Volunteers Mobilized for Food Delivery',
    message: 'Over 450 certified Aapda Mitra community volunteers have joined district rescue operations for boat-based dry ration delivery in inundated agricultural settlements.',
    severity: 'info',
    state: 'National',
    timestamp: new Date(Date.now() - 1000 * 60 * 1920).toISOString(), // 32 hours ago
  },
  {
    id: 'ALT-WEATHER-2026-001',
    title: 'High Astronomical Tide Warning for West Coast (4.87 Meters)',
    message: 'Municipal maritime board warns of astronomical high tide reaching 4.87 meters expected today. Citizens strictly prohibited from promenades, sea-faces, and beaches.',
    severity: 'warning',
    state: 'Maharashtra',
    timestamp: new Date(Date.now() - 1000 * 60 * 2160).toISOString(), // 36 hours ago
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicAlert[] | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const stateFilter = (req.query.state as string)?.trim();
    const pageSize = 20;

    let dataset = MOCK_PUBLIC_ALERTS;

    // Filter by state if provided (includes state-specific + National alerts)
    if (stateFilter && stateFilter.toLowerCase() !== 'all' && stateFilter.toLowerCase() !== 'national') {
      dataset = MOCK_PUBLIC_ALERTS.filter((alert) => {
        if (!alert.state || alert.state === 'National') return true;
        return alert.state.toLowerCase() === stateFilter.toLowerCase();
      });
    }

    const startIndex = (page - 1) * pageSize;
    const paginated = dataset.slice(startIndex, startIndex + pageSize);

    // Set cache control for performance
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(paginated);
  } catch (err: any) {
    console.error('Error fetching public alerts feed:', err);
    return res.status(500).json({ error: 'Internal Server Error fetching alerts' });
  }
}
