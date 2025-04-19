import { StateCreator, StoreApi } from 'zustand';

/**
 * Middleware types for Zustand stores
 */
export type LoggerMiddleware = <T>(
  f: StateCreator<T>,
  name?: string
) => StateCreator<T>;

export type PersistMiddleware = <T>(
  f: StateCreator<T>,
  name: string
) => StateCreator<T>;

/**
 * Logger middleware for Zustand stores
 * Logs all state changes with previous and next state
 */
export const logger: LoggerMiddleware = (f, name = 'store') => (set, get, store) => {
  type T = ReturnType<typeof f>;
  
  const loggedSet: typeof set = (...args) => {
    const prevState = get();
    set(...args);
    const nextState = get();
    
    // Log state changes
    console.group(`${name} - State Updated`);
    console.log('Previous State:', prevState);
    console.log('Next State:', nextState);
    console.log('Action:', args[0]);
    console.groupEnd();
  };
  
  return f(loggedSet, get, store);
};

/**
 * Persist middleware for Zustand stores
 * Saves and loads state from localStorage
 */
export const persist: PersistMiddleware = (f, name) => (set, get, store) => {
  const persistKey = `marmitas-state-${name}`;
  
  // Try to load persisted state
  try {
    const persistedState = localStorage.getItem(persistKey);
    
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      set(parsed);
    }
  } catch (error) {
    console.error(`Failed to load persisted state for ${name}`, error);
  }
  
  // Wrap set to persist state changes
  const persistedSet: typeof set = (...args) => {
    set(...args);
    try {
      const state = get();
      localStorage.setItem(persistKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Failed to persist state for ${name}`, error);
    }
  };
  
  return f(persistedSet, get, store);
};

/**
 * Types for immer integration with Zustand
 */
export type ImmerStateCreator<T> = (
  setState: (fn: (draft: T) => void) => void,
  getState: () => T,
  store: StoreApi<T>
) => T;

/**
 * Types for reset functionality
 */
export interface WithReset<T> {
  reset: () => void;
}

/**
 * Helper to add reset functionality to a store
 */
export const withReset = <T>(
  creator: StateCreator<T>,
  resetFn: (state: T) => T
): StateCreator<T & WithReset<T>> => 
  (set, get, store) => {
    const originalState = creator(set, get, store);
    return {
      ...originalState,
      reset: () => set(state => resetFn(state)),
    };
  };

/**
 * Helper to merge slices for complex stores
 */
export function combineSlices<
  State extends object,
  Slices extends Record<string, StateCreator<any>>
>(
  initialState: State,
  slices: Slices
): StateCreator<State & { [K in keyof Slices]: ReturnType<Slices[K]> }> {
  return (set, get, store) => {
    const createSelectors = <State extends Object>(
      store: StoreApi<State>
    ) => {
      return Object.keys(store.getState()).reduce(
        (acc, key) => {
          const selector = (state: State) => state[key as keyof State];
          acc[key as keyof State] = selector;
          return acc;
        },
        {} as Record<keyof State, (state: State) => State[keyof State]>
      );
    };

    const sliceSelectors = {} as Record<
      keyof Slices,
      Record<string, (state: any) => any>
    >;

    const combinedState = Object.entries(slices).reduce(
      (acc, [name, slice]) => {
        const sliceState = slice(
          partial => set(state => ({ ...state, [name]: { ...state[name], ...partial } })),
          () => get()[name],
          store
        );
        
        // Create selectors for the slice
        sliceSelectors[name as keyof Slices] = createSelectors({
          getState: () => sliceState,
          setState: () => {},
          subscribe: () => () => {},
          destroy: () => {},
        });
        
        return { ...acc, [name]: sliceState };
      },
      { ...initialState }
    );

    return combinedState;
  };
} 