import { useEffect, useState } from 'react';
import { readDemoUserAccounts } from './userStore';

const STORAGE_KEY = 'rklink-sql-security-demo:current-user-id:v4';
const AUTH_STORAGE_KEY = 'rklink-sql-security-demo:auth-status:v1';
const USER_EVENT = 'rklink-sql-security-demo:current-user-change';
const DEFAULT_USER_ID = 'dba';
const SIGNED_OUT = 'signed-out';

const isKnownUser = (userId?: string | null) =>
  Boolean(userId && readDemoUserAccounts().some((user) => user.id === userId));

const getDefaultUserId = () => readDemoUserAccounts()[0]?.id || DEFAULT_USER_ID;

export const readCurrentDemoUserId = () => {
  if (typeof window === 'undefined') return DEFAULT_USER_ID;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isKnownUser(stored) ? stored || getDefaultUserId() : getDefaultUserId();
};

export const writeCurrentDemoUserId = (userId: string) => {
  const nextUserId = isKnownUser(userId) ? userId : getDefaultUserId();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextUserId);
    window.dispatchEvent(
      new CustomEvent(USER_EVENT, { detail: { userId: nextUserId } }),
    );
  }

  return nextUserId;
};

export const isDemoUserSignedIn = () => {
  if (typeof window === 'undefined') return true;

  return window.localStorage.getItem(AUTH_STORAGE_KEY) !== SIGNED_OUT;
};

export const signInDemoUser = (userId: string) => {
  const nextUserId = writeCurrentDemoUserId(userId);

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(USER_EVENT, { detail: { userId: nextUserId } }),
    );
  }

  return nextUserId;
};

export const signOutDemoUser = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_STORAGE_KEY, SIGNED_OUT);
    window.dispatchEvent(new Event(USER_EVENT));
  }
};

export const subscribeCurrentDemoUserChange = (listener: () => void) => {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(USER_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(USER_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};

export const useCurrentDemoUserId = () => {
  const [userId, setUserId] = useState(readCurrentDemoUserId);

  useEffect(
    () =>
      subscribeCurrentDemoUserChange(() => {
        setUserId(readCurrentDemoUserId());
      }),
    [],
  );

  return userId;
};
