/**
 * メインアプリ
 */

import { useState, useCallback, useEffect } from 'react';
import { useLiff } from '@/hooks/useLiff';
import { getShifts, addShift, deleteShift, hasSubmittedPeriod } from '@/services/shiftStorage';
import { getShiftPeriods, createShiftPeriod, confirmPeriodShifts } from '@/services/periodService';
import { getGroupMembers } from '@/services/groupMembers';
import { Header } from '@/components/Header/Header';
import { Tabs, type TabId } from '@/components/Tabs/Tabs';
import { Calendar } from '@/components/Calendar/Calendar';
import { ShiftForm } from '@/components/ShiftForm/ShiftForm';
import { ShiftList } from '@/components/ShiftList/ShiftList';
import { PeriodSelector } from '@/components/PeriodSelector/PeriodSelector';
import { PeriodRegister } from '@/components/PeriodRegister/PeriodRegister';
import { ConfirmedList } from '@/components/ConfirmedList/ConfirmedList';
import { CreatePeriodModal } from '@/components/CreatePeriodModal/CreatePeriodModal';
import { MemberList } from '@/components/MemberList/MemberList';
import { LoginPrompt } from '@/components/LoginPrompt/LoginPrompt';
import { Loading } from '@/components/Loading/Loading';
import type { Shift, ShiftPeriod } from '@/types/shift';
import type { ShiftFormData } from '@/types/shift';
import type { GroupMember } from '@/types/group';
import './App.css';

export function App() {
  const { isReady, isLoggedIn, userName, userId, groupId, error, login } = useLiff();
  const [activeTab, setActiveTab] = useState<TabId>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [registerInitialDate, setRegisterInitialDate] = useState<Date | undefined>();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [periods, setPeriods] = useState<ShiftPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ShiftPeriod | null>(null);
  const [draftShiftsInPeriod, setDraftShiftsInPeriod] = useState<Shift[]>([]);
  const [submittedForPeriod, setSubmittedForPeriod] = useState(false);
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const refreshShifts = useCallback(async () => {
    setShiftsLoading(true);
    try {
      const list = await getShifts(userId, groupId);
      setShifts(list);
    } finally {
      setShiftsLoading(false);
    }
  }, [userId, groupId]);

  const refreshPeriods = useCallback(async () => {
    if (!groupId) return;
    setPeriodsLoading(true);
    try {
      const list = await getShiftPeriods(groupId);
      setPeriods(list);
    } finally {
      setPeriodsLoading(false);
    }
  }, [groupId]);

  const refreshDraftInPeriod = useCallback(async () => {
    if (!selectedPeriod || !userId || !groupId) return;
    const list = await getShifts(userId, groupId, { periodId: selectedPeriod.id, status: 'draft' });
    setDraftShiftsInPeriod(list);
    const submitted = await hasSubmittedPeriod(userId, selectedPeriod.id);
    setSubmittedForPeriod(submitted);
  }, [selectedPeriod, userId, groupId]);

  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    refreshShifts();
  }, [isReady, isLoggedIn, refreshShifts]);

  useEffect(() => {
    if (groupId && isLoggedIn) refreshPeriods();
  }, [groupId, isLoggedIn, refreshPeriods]);

  useEffect(() => {
    if (selectedPeriod) refreshDraftInPeriod();
  }, [selectedPeriod, refreshDraftInPeriod, refreshShifts]);

  const handleAddShift = useCallback(
    async (data: ShiftFormData) => {
      const added = await addShift(userId, data, groupId);
      if (added) {
        await refreshShifts();
        setActiveTab('list');
      } else {
        alert('登録に失敗しました。');
      }
    },
    [userId, groupId, refreshShifts]
  );

  const handleDeleteShift = useCallback(
    async (id: string) => {
      const ok = await deleteShift(userId, id);
      if (ok) {
        await refreshShifts();
        if (selectedPeriod) await refreshDraftInPeriod();
      }
    },
    [userId, refreshShifts, selectedPeriod, refreshDraftInPeriod]
  );

  const handleGoToRegister = useCallback((date: Date) => {
    setRegisterInitialDate(date);
    setActiveTab('register');
  }, []);

  const handleCreatePeriod = useCallback(
    async (p: ShiftPeriod) => {
      setPeriods((prev) => [p, ...prev]);
      setSelectedPeriod(p);
    },
    []
  );

  const handleConfirmPeriod = useCallback(
    async (periodId: string) => {
      if (!confirm('この期間の提出済みシフトを確定しますか？')) return;
      const n = await confirmPeriodShifts(periodId, userId);
      if (n > 0) {
        await refreshShifts();
        await refreshDraftInPeriod();
      }
    },
    [userId, refreshShifts, refreshDraftInPeriod]
  );

  const refreshMembers = useCallback(async () => {
    if (!groupId) return;
    setMembersLoading(true);
    try {
      const list = await getGroupMembers(groupId);
      setMembers(list);
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (activeTab === 'members' && groupId) refreshMembers();
  }, [activeTab, groupId, refreshMembers]);

  useEffect(() => {
    if (groupId && isLoggedIn) refreshMembers();
  }, [groupId, isLoggedIn]);

  const isAdmin = !!groupId && members.some((m) => m.userId === userId && m.isAdmin);

  const createPeriod = useCallback(
    async (
      gid: string,
      name: string,
      startDate: string,
      endDate: string,
      deadlineAt?: string | null
    ) => {
      return createShiftPeriod(gid, name, startDate, endDate, deadlineAt);
    },
    []
  );

  const confirmedShifts = shifts.filter((s) => s.status === 'confirmed');

  if (!isReady) {
    return <Loading message={error ?? '読み込み中...'} />;
  }

  const needLogin = !isLoggedIn && !error;

  return (
    <div id="app">
      <Header userName={userName} />
      <div className="container">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {needLogin ? (
          <LoginPrompt onLogin={login} />
        ) : (
          <>
            {activeTab === 'calendar' && (
              <Calendar
                shifts={shifts}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onGoToRegister={handleGoToRegister}
              />
            )}
            {activeTab === 'register' && (
              <>
                {groupId ? (
                  <>
                    <PeriodSelector
                      periods={periods}
                      selectedId={selectedPeriod?.id ?? null}
                      onSelect={setSelectedPeriod}
                      onCreatePeriod={() => setShowCreatePeriodModal(true)}
                      disabled={periodsLoading}
                    />
                    {selectedPeriod && (
                      <>
                        <PeriodRegister
                          period={selectedPeriod}
                          userName={userName || 'あなた'}
                          lineUserId={userId}
                          groupId={groupId}
                          draftShifts={draftShiftsInPeriod}
                          submitted={submittedForPeriod}
                          onRefresh={() => {
                            refreshShifts();
                            refreshDraftInPeriod();
                          }}
                          onDeleteShift={handleDeleteShift}
                        />
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleConfirmPeriod(selectedPeriod.id)}
                          >
                            この期間の提出を確定する
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <ShiftForm initialDate={registerInitialDate} onSubmit={handleAddShift} />
                )}
              </>
            )}
            {activeTab === 'list' && (
              <ShiftList shifts={shifts} onDelete={handleDeleteShift} loading={shiftsLoading} />
            )}
            {activeTab === 'confirmed' && (
              <ConfirmedList shifts={confirmedShifts} loading={shiftsLoading} />
            )}
            {activeTab === 'members' && (
              groupId ? (
                <MemberList
                  members={members}
                  loading={membersLoading}
                  currentUserId={userId}
                />
              ) : (
                <div className="card">
                  <div className="card-title">メンバー</div>
                  <div className="empty-state">
                    グループトークから開くと、ここにメンバー一覧が表示されます。
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
      {showCreatePeriodModal && groupId && (
        <CreatePeriodModal
          groupId={groupId}
          onCreate={handleCreatePeriod}
          onClose={() => setShowCreatePeriodModal(false)}
          createPeriod={createPeriod}
        />
      )}
    </div>
  );
}
