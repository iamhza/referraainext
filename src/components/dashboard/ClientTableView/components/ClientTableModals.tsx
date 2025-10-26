import React from 'react';
import { CreateIssueDialog } from '@/components/issues/CreateIssueDialog';
import { ServiceDetailDrawer } from '@/components/services/ServiceDetailDrawer';
import { AuthorizationModal } from '@/components/authorizations/AuthorizationModal';
import { ClientDrawer } from '@/components/clients/drawer/ClientDrawer';
import type { ClientTableModalsProps } from '../types';

/**
 * Consolidated modals/drawers - extracted to reduce main component clutter
 */
export const ClientTableModals = React.memo(({
  issueDialogOpen,
  setIssueDialogOpen,
  selectedServiceForIssue,
  setSelectedServiceForIssue,
  serviceDrawerOpen,
  setServiceDrawerOpen,
  selectedServiceForDrawer,
  setSelectedServiceForDrawer,
  authModalOpen,
  setAuthModalOpen,
  selectedServiceForAuth,
  setSelectedServiceForAuth,
  clientDrawerOpen,
  setClientDrawerOpen,
  selectedClientId,
  setSelectedClientId,
  onRefresh,
}: ClientTableModalsProps) => {
  return (
    <>
      {selectedServiceForIssue && (
        <CreateIssueDialog
          open={issueDialogOpen}
          onOpenChange={setIssueDialogOpen}
          serviceRelationshipId={selectedServiceForIssue._id}
          clientId={selectedServiceForIssue.clientId}
          clientName={`${selectedServiceForIssue.client?.firstName} ${selectedServiceForIssue.client?.lastName}`}
          providerName={selectedServiceForIssue.providerName}
          serviceName={selectedServiceForIssue.serviceName || 'Service'}
          onSuccess={() => {
            onRefresh();
            setSelectedServiceForIssue(null);
          }}
        />
      )}

      <ServiceDetailDrawer
        serviceRelationshipId={selectedServiceForDrawer}
        isOpen={serviceDrawerOpen}
        onClose={() => {
          setServiceDrawerOpen(false);
          setSelectedServiceForDrawer(null);
        }}
        onRefresh={onRefresh}
      />

      {selectedServiceForAuth && (
        <AuthorizationModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          serviceRelationshipId={selectedServiceForAuth._id}
          clientName={`${selectedServiceForAuth.client?.firstName} ${selectedServiceForAuth.client?.lastName}`}
          providerName={selectedServiceForAuth.providerName}
          serviceName={selectedServiceForAuth.serviceName || 'Service'}
          existingAuthorization={selectedServiceForAuth.authorization ? {
            _id: selectedServiceForAuth.authorization._id,
            serviceRelationshipId: selectedServiceForAuth._id,
            status: selectedServiceForAuth.authorization.status as any,
            approvalNumber: selectedServiceForAuth.authorization.approvalNumber,
            startDate: selectedServiceForAuth.authorization.startDate,
            endDate: selectedServiceForAuth.authorization.endDate,
            units: selectedServiceForAuth.authorization.units,
            unitType: selectedServiceForAuth.authorization.unitType as any,
            fundingSource: selectedServiceForAuth.authorization.fundingSource,
            notes: selectedServiceForAuth.authorization.notes,
          } : null}
          onSuccess={() => {
            onRefresh();
            setSelectedServiceForAuth(null);
          }}
        />
      )}

      {selectedClientId && (
        <ClientDrawer
          clientId={selectedClientId}
          open={clientDrawerOpen}
          onClose={() => {
            setClientDrawerOpen(false);
            setSelectedClientId(null);
          }}
        />
      )}
    </>
  );
});

ClientTableModals.displayName = 'ClientTableModals';
