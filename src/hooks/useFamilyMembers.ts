import { useState, useCallback, useEffect } from 'react';
import {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  FamilyMember,
  AddFamilyMemberRequest,
  UpdateFamilyMemberRequest,
} from '../services/homeCareService';

export interface FamilyMembersState {
  familyMembers: FamilyMember[];
  loading: boolean;
  error: string | null;
}

export const useFamilyMembers = () => {
  const [state, setState] = useState<FamilyMembersState>({
    familyMembers: [],
    loading: false,
    error: null,
  });

  const fetchFamilyMembers = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { familyMembers, error } = await getFamilyMembers(userId);
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      return { success: false, error };
    }

    setState(prev => ({
      ...prev,
      loading: false,
      familyMembers: familyMembers || [],
    }));
    return { success: true, familyMembers: familyMembers || [] };
  }, []);

  const addMember = useCallback(async (memberData: AddFamilyMemberRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { familyMember, error } = await addFamilyMember(memberData);
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      return { success: false, error };
    }

    if (familyMember) {
      setState(prev => ({
        ...prev,
        loading: false,
        familyMembers: [...prev.familyMembers, familyMember],
      }));
      return { success: true, familyMember };
    }

    const genericError = 'Failed to add family member';
    setState(prev => ({ ...prev, loading: false, error: genericError }));
    return { success: false, error: genericError };
  }, []);

  const updateMember = useCallback(
    async (familyMemberId: string, memberData: UpdateFamilyMemberRequest) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { familyMember, error } = await updateFamilyMember(familyMemberId, memberData);
      
      if (error) {
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (familyMember) {
        setState(prev => ({
          ...prev,
          loading: false,
          familyMembers: prev.familyMembers.map(m =>
            m.familyMemberId === familyMemberId ? familyMember : m,
          ),
        }));
        return { success: true, familyMember };
      }

      const genericError = 'Failed to update family member';
      setState(prev => ({ ...prev, loading: false, error: genericError }));
      return { success: false, error: genericError };
    },
    [],
  );

  const deleteMember = useCallback(async (familyMemberId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { success, error } = await deleteFamilyMember(familyMemberId);
    
    if (!success) {
      setState(prev => ({ ...prev, loading: false, error: error || 'Failed to delete family member' }));
      return { success: false, error };
    }

    setState(prev => ({
      ...prev,
      loading: false,
      familyMembers: prev.familyMembers.filter(m => m.familyMemberId !== familyMemberId),
    }));
    return { success: true };
  }, []);

  return {
    ...state,
    fetchFamilyMembers,
    addMember,
    updateMember,
    deleteMember,
  };
};
