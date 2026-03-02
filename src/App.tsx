/**
 * メインアプリ
 */

import { useState, useCallback, useEffect } from 'react';
import { useLiff } from '@/hooks/useLiff';
import { getShifts, addShift, deleteShift } from '@/services/shiftStorage';
import { getGroupMembers } from '@/services/groupMembers';
import { Header } from '@/components/Header/Header';
import { Tabs, type TabId } from '@/components/Tabs/Tabs';
import { Calendar } from '@/components/Calendar/Calendar';
import { ShiftForm } from '@/components/ShiftForm/ShiftForm';
import { ShiftList } from '@/components/ShiftList/ShiftList';
import { MemberList } from '@/components/MemberList/MemberList';
import { LoginPrompt } from '@/components/LoginPrompt/LoginPrompt';
import { Loading } from '@/components/Loading/Loading';
import type { Shift } from '@/types/shift';
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

  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    refreshShifts();
  }, [isReady, isLoggedIn, refreshShifts]);

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
      if (ok) await refreshShifts();
    },
    [userId, refreshShifts]
  );

  const handleGoToRegister = useCallback((date: Date) => {
    setRegisterInitialDate(date);
    setActiveTab('register');
  }, []);

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
              <ShiftForm initialDate={registerInitialDate} onSubmit={handleAddShift} />
            )}
            {activeTab === 'list' && (
              <ShiftList shifts={shifts} onDelete={handleDeleteShift} loading={shiftsLoading} />
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
    </div>
  );
}
