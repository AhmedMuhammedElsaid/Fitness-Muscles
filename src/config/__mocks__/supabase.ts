interface QueryResult {
  data: unknown;
  error: unknown;
}

interface MockState {
  session: { user: { id: string } } | null;
  selectResult: QueryResult;
  writeResult: QueryResult;
  rpcResult: QueryResult;
}

function defaults(): MockState {
  return {
    session: { user: { id: 'coach-1' } },
    selectResult: { data: [], error: null },
    writeResult: { data: null, error: null },
    rpcResult: { data: null, error: null },
  };
}

// jest can instantiate this manual mock twice (once injected for `@/config/supabase`,
// once when the test imports it directly to drive state). Anchor the state on
// globalThis so both instances mutate the same object.
const STATE_KEY = '__fm_supabase_mock_state__';
const globalScope = globalThis as unknown as Record<string, MockState | undefined>;
const state: MockState = globalScope[STATE_KEY] ?? (globalScope[STATE_KEY] = defaults());

export function __setSession(session: MockState['session']): void {
  state.session = session;
}

export function __setSelect(data: unknown[], error: unknown = null): void {
  state.selectResult = { data, error };
}

export function __setWriteError(error: unknown): void {
  state.writeResult = { data: null, error };
}

export function __setRpc(data: unknown, error: unknown = null): void {
  state.rpcResult = { data, error };
}

export function __reset(): void {
  Object.assign(state, defaults());
}

function thenable(result: QueryResult): PromiseLike<QueryResult> {
  return { then: (onFulfilled) => Promise.resolve(result).then(onFulfilled) };
}

interface Builder {
  select: () => PromiseLike<QueryResult>;
  insert: () => PromiseLike<QueryResult>;
  upsert: () => PromiseLike<QueryResult>;
  update: () => Builder;
  delete: () => Builder;
  eq: () => PromiseLike<QueryResult> & Builder;
}

function builder(): Builder {
  const b: Builder = {
    select: () => thenable(state.selectResult),
    insert: () => thenable(state.writeResult),
    upsert: () => thenable(state.writeResult),
    update: () => b,
    delete: () => b,
    eq: () => Object.assign(thenable(state.writeResult), b),
  };
  return b;
}

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: state.session } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
  },
  from: () => builder(),
  rpc: async () => state.rpcResult,
  channel: () => {
    const ch = { on: () => ch, subscribe: () => ch };
    return ch;
  },
  removeChannel: () => undefined,
};
