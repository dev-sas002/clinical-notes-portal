import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { SessionState, SessionUser } from "../../types"

/**
 * Read-only mirror of the server's session.
 *
 * It has no thunks and no way to change the tenant: the value arrives from
 * the server component tree at boot and is replaced only by signing in or
 * out. Keeping it in its own slice is what makes that obvious - the care
 * notes slice can read the identity but cannot author it.
 */

export const initialState: SessionState = {
  user: null,
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    sessionReceived: (state, action: PayloadAction<SessionUser | null>) => {
      state.user = action.payload
    },
    sessionCleared: (state) => {
      state.user = null
    },
  },
})

export const { sessionReceived, sessionCleared } = sessionSlice.actions

export default sessionSlice.reducer
