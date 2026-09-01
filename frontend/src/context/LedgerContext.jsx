'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  INITIAL_REQUESTS,
  INITIAL_INVENTORY,
  INITIAL_PUBLIC_NEEDS,
  INITIAL_WORKFORCE_DEMANDS,
  INITIAL_CERTIFICATES,
  INITIAL_AI_INSIGHTS,
} from '../mock/initialData';

const LedgerContext = createContext(null);

export const LedgerProvider = ({ children }) => {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [publicNeeds, setPublicNeeds] = useState(INITIAL_PUBLIC_NEEDS);
  const [workforceDemands, setWorkforceDemands] = useState(INITIAL_WORKFORCE_DEMANDS);
  const [certificates, setCertificates] = useState(INITIAL_CERTIFICATES);
  const [aiInsights, setAiInsights] = useState(INITIAL_AI_INSIGHTS);

  // Filter & Navigation States
  const [activeTab, setActiveTab] = useState('matrix');
  const [activeCategory, setActiveCategory] = useState('All');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [lastUpdatedInventoryId, setLastUpdatedInventoryId] = useState(null);

  // Modals
  const [selectedRequestModal, setSelectedRequestModal] = useState(null);
  const [isAddDonationModalOpen, setIsAddDonationModalOpen] = useState(false);
  const [selectedWorkforceDemandModal, setSelectedWorkforceDemandModal] = useState(null);
  const [isPublicBroadcastModalOpen, setIsPublicBroadcastModalOpen] = useState(false);
  const [selectedCertificateModal, setSelectedCertificateModal] = useState(null);
  const [pledgedNeed, setPledgedNeed] = useState(null);
  const [verifySearchUuid, setVerifySearchUuid] = useState('');

  // Add incoming help offer
  const addIncomingRequest = (newReqData) => {
    const id = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const reliefId = `REL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest = {
      id,
      reliefId,
      requestStatus: 'Pending',
      timestamp: 'Just now',
      numericQuantity: Number(newReqData.numericQuantity) || 100,
      ...newReqData,
    };

    setRequests((prev) => [newRequest, ...prev]);
    setIsAddDonationModalOpen(false);
  };

  // Approve & Route Donation
  const approveAndRouteDonation = (requestId, targetShelterOrName) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const reliefId = req.reliefId || `REL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update Request status
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              requestStatus: 'Approved',
              reliefId,
              routedTo: targetShelterOrName,
            }
          : r
      )
    );

    // Create a verified Certificate
    const newCert = {
      id: `CERT-2026-${Math.floor(100 + Math.random() * 900)}`,
      uuid: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      donorName: req.donor,
      contributionSummary: `${req.quantity || req.numericQuantity} ${req.resource}`,
      date: new Date().toISOString().split('T')[0],
      reliefId,
      verifiedBy: 'EOC Senior Logistics Officer - Raigad Grid',
      status: 'Verified',
    };
    setCertificates((prev) => [newCert, ...prev]);

    // Update inventory item if matching or add stock
    setInventory((prev) => {
      const existing = prev.find(
        (item) => item.name.toLowerCase().includes(req.resource.toLowerCase())
      );
      if (existing) {
        setLastUpdatedInventoryId(existing.id);
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                numericQuantity: (item.numericQuantity || 0) + (req.numericQuantity || 0),
                quantity: `${(item.numericQuantity || 0) + (req.numericQuantity || 0)} units`,
                status: 'Adequate',
              }
            : item
        );
      }
      return prev;
    });

    if (selectedRequestModal?.id === requestId) {
      setSelectedRequestModal(null);
    }
  };

  // Reject Request
  const rejectRequest = (requestId, reason) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, requestStatus: 'Rejected', rejectionReason: reason }
          : r
      )
    );
    if (selectedRequestModal?.id === requestId) {
      setSelectedRequestModal(null);
    }
  };

  // Broadcast Need
  const broadcastNeed = (needId) => {
    setPublicNeeds((prev) =>
      prev.map((n) => (n.id === needId ? { ...n, isBroadcasted: true } : n))
    );
  };

  // Deploy Workforce
  const deployWorkforce = (demandId) => {
    setWorkforceDemands((prev) =>
      prev.map((d) => (d.id === demandId ? { ...d, status: 'Deployed' } : d))
    );
    if (selectedWorkforceDemandModal?.id === demandId) {
      setSelectedWorkforceDemandModal((prev) => (prev ? { ...prev, status: 'Deployed' } : null));
    }
  };

  return (
    <LedgerContext.Provider
      value={{
        requests,
        inventory,
        publicNeeds,
        workforceDemands,
        certificates,
        aiInsights,
        activeTab,
        setActiveTab,
        activeCategory,
        setActiveCategory,
        inventoryStatusFilter,
        setInventoryStatusFilter,
        searchQuery,
        setSearchQuery,
        selectedSector,
        setSelectedSector,
        lastUpdatedInventoryId,
        selectedRequestModal,
        setSelectedRequestModal,
        isAddDonationModalOpen,
        setIsAddDonationModalOpen,
        selectedWorkforceDemandModal,
        setSelectedWorkforceDemandModal,
        isPublicBroadcastModalOpen,
        setIsPublicBroadcastModalOpen,
        selectedCertificateModal,
        setSelectedCertificateModal,
        pledgedNeed,
        setPledgedNeed,
        verifySearchUuid,
        setVerifySearchUuid,
        addIncomingRequest,
        approveAndRouteDonation,
        rejectRequest,
        broadcastNeed,
        deployWorkforce,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};

export default LedgerContext;
